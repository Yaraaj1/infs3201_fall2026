
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config({ override: true })

/**
 * Creates an Ethereal email transporter.
 *
 * @returns {Object} The configured email transporter.
 */
function createEmailTransporter() {
    let host = process.env.SMTP_HOST
    let port = Number(process.env.SMTP_PORT)
    let user = process.env.SMTP_USER
    let password = process.env.SMTP_PASS

    if (!host || !port || !user || !password) {
        throw new Error('Missing SMTP configuration in .env')
    }

    return nodemailer.createTransport({
        host: host,
        port: port,
        secure: false,
        auth: {
            user: user,
            pass: password
        }
    })
}

/**
 * Sends an order-ready email with its PDF invoice attached.
 *
 * @param {Object} customer Customer information.
 * @param {Object} order Order information.
 * @param {string} invoicePath Path to the invoice PDF.
 * @returns {Promise<void>}
 */
async function sendInvoiceEmail(customer, order, invoicePath) {
    if (!customer.email) {
        throw new Error('Customer email address is missing')
    }

    let transporter = createEmailTransporter()

    let invoiceNumber = order.orderId || order._id.toString()

    let customerName = customer.name || customer.firstName || 'Customer'

    let mailOptions = {
        from: '"Laundry Service" <' + process.env.SMTP_USER + '>',
        to: customer.email,
        subject: 'Your Laundry Order ' + invoiceNumber + ' is Ready',
        text:
            'Dear ' + customerName +
            ',\n\nYour laundry order ' + invoiceNumber +
            ' is now ready.\n\n' +
            'Please find your invoice attached.\n\n' +
            'Thank you for choosing our laundry service!',
        attachments: [
            {
                filename: 'Invoice-' + invoiceNumber + '.pdf',
                path: invoicePath
            }
        ]
    }

    let info = await transporter.sendMail(mailOptions)

    console.log('Email sent successfully!')
    console.log('Message ID:', info.messageId)
    console.log(
        'Preview URL:',
        nodemailer.getTestMessageUrl(info)
    )
}

export {
    createEmailTransporter,
    sendInvoiceEmail
}
