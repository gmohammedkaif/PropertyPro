import { Payment } from './payment.model.js'
import { createNotificationIdempotent } from '../notification/notification.model.js'

let isSweeperRunning = false

export async function sweepPaymentOverdues(): Promise<{ overdueCount: number }> {
  if (isSweeperRunning) return { overdueCount: 0 }
  isSweeperRunning = true

  let overdueCount = 0

  try {
    const now = new Date()

    // 1. Query pending payments where dueDate is strictly before current server time ($lt: now)
    const overduePayments = await Payment.find({
      status: 'pending',
      dueDate: { $lt: now },
    })

    for (const payment of overduePayments) {
      // Idempotent safeguard: double-check status is strictly 'pending'
      if (payment.status !== 'pending') continue

      payment.status = 'overdue'
      await payment.save()
      overdueCount++

      const paymentIdStr = payment._id.toString()

      // 2. Deliver idempotent notification to tenant if tenantEmail is present
      if (payment.tenantEmail) {
        await createNotificationIdempotent({
          userEmail: payment.tenantEmail.toLowerCase(),
          title: 'Rent Payment Overdue ⚠️',
          message: `Your payment of ₹${payment.amount.toLocaleString('en-IN')} for ${payment.propertyName} is past due date (${new Date(payment.dueDate).toLocaleDateString()}). Please settle your invoice.`,
          type: 'danger',
          eventType: 'PAYMENT_OVERDUE',
          relatedEntityId: paymentIdStr,
        })
      }

      // 3. Deliver idempotent notification to owner if ownerEmail is present
      if (payment.ownerEmail) {
        await createNotificationIdempotent({
          userEmail: payment.ownerEmail.toLowerCase(),
          title: 'Rent Payment Overdue ⚠️',
          message: `Rent payment of ₹${payment.amount.toLocaleString('en-IN')} for ${payment.propertyName} (${payment.tenantName}) is overdue.`,
          type: 'warning',
          eventType: 'PAYMENT_OVERDUE',
          relatedEntityId: paymentIdStr,
        })
      }
    }
  } finally {
    isSweeperRunning = false
  }

  return { overdueCount }
}
