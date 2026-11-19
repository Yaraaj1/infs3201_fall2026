
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { getOrderDetails } from '../businessLogic.js'

dotenv.config({ override: true })

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)

/**
 * Checks whether two MongoDB IDs are equal.
 *
 * @param {Object} firstId The first ID.
 * @param {Object} secondId The second ID.
 * @returns {boolean} True if the IDs match.
 */
function idsAreEqual(firstId, secondId) {
    if (firstId === undefined || secondId === undefined) {
        return false
    }

    return firstId.toString() === secondId.toString()
}

/**
 * Finds the service associated with an order item.
 *
 * @param {Object} item The order item.
 * @param {Array<Object>} services Available services.
 * @returns {Object|null} The matching service.
 */
function findServiceForItem(item, services) {
    for (let service of services) {
        if (idsAreEqual(item.serviceId, service._id)) {
            return service
        }
    }

    return null
}

/**
 * Generates a PDF invoice for an order.
 *
 * @param {string} orderId The MongoDB ID of the order.
 * @returns {Promise<string>} The path of the generated PDF.
 */
async function generateInvoice(orderId) {
    dotenv.config({ override: true })

    let minimumOrderCharge = Number(process.env.MINIMUM_ORDER_CHARGE)
    let freeDeliveryThreshold = Number(process.env.FREE_DELIVERY_THRESHOLD)
    let deliveryCharge = Number(process.env.DELIVERY_CHARGE)

    if (
        !Number.isFinite(minimumOrderCharge) ||
        !Number.isFinite(freeDeliveryThreshold) ||
        !Number.isFinite(deliveryCharge)
    ) {
        throw new Error('Invalid pricing configuration in .env')
    }

    let details = await getOrderDetails(
        orderId,
        minimumOrderCharge,
        freeDeliveryThreshold,
        deliveryCharge
    )

    if (details === null || details.customer === null) {
        throw new Error('Order or customer not found')
    }

    let order = details.order
    let customer = details.customer
    let services = details.services
    let pricing = details.pricing

    const pdfDocument = await PDFDocument.create()

    const regularFont = await pdfDocument.embedFont(
        StandardFonts.Helvetica
    )

    const boldFont = await pdfDocument.embedFont(
        StandardFonts.HelveticaBold
    )

    let page = pdfDocument.addPage([595, 842])

    let pageWidth = page.getWidth()
    let y = 790

    /**
     * Draws text on the invoice.
     *
     * @param {string} text The text to display.
     * @param {number} x The horizontal position.
     * @param {number} yPosition The vertical position.
     * @param {number} size The font size.
     * @param {Object} font The font to use.
     */
    function drawText(text, x, yPosition, size, font) {
        page.drawText(String(text), {
            x: x,
            y: yPosition,
            size: size,
            font: font,
            color: rgb(0.15, 0.15, 0.15)
        })
    }

    /**
     * Draws a horizontal line.
     *
     * @param {number} yPosition The vertical position.
     */
    function drawLine(yPosition) {
        page.drawLine({
            start: { x: 45, y: yPosition },
            end: { x: pageWidth - 45, y: yPosition },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8)
        })
    }

    function formatMoney(amount) {
        return Number(amount).toFixed(2) + ' QAR'
    }

    // Invoice heading
    drawText('LAUNDRY SERVICE', 45, y, 24, boldFont)

    y = y - 35

    drawText('INVOICE', 45, y, 18, boldFont)

    y = y - 35

    drawLine(y)

    // Order information
    y = y - 30

    let invoiceNumber = order.orderId || order._id.toString()

    drawText('Order Number: ' + invoiceNumber, 45, y, 11, regularFont)

    y = y - 20

    drawText('Order Date: ' + order.orderDate, 45, y, 11, regularFont)

    y = y - 20

    drawText('Order Status: ' + order.status, 45, y, 11, regularFont)

    // Customer information
    y = y - 40

    drawLine(y)

    y = y - 30

    drawText('CUSTOMER INFORMATION', 45, y, 13, boldFont)

    y = y - 25

    let customerName = customer.name

    if (!customerName) {
        customerName = customer.firstName || ''

        if (customer.lastName) {
            customerName = customerName + ' ' + customer.lastName
        }
    }

    drawText('Name: ' + customerName, 45, y, 11, regularFont)

    y = y - 20

    drawText(
        'Email: ' + (customer.email || 'Not provided'),
        45,
        y,
        11,
        regularFont
    )

    y = y - 20

    drawText(
        'Phone: ' + (customer.phone || 'Not provided'),
        45,
        y,
        11,
        regularFont
    )

    // Order items
    y = y - 40

    drawLine(y)

    y = y - 30

    drawText('ORDER DETAILS', 45, y, 13, boldFont)

    y = y - 30

    drawText('Service', 45, y, 10, boldFont)
    drawText('Quantity', 275, y, 10, boldFont)
    drawText('Unit Price', 365, y, 10, boldFont)
    drawText('Total', 475, y, 10, boldFont)

    y = y - 12

    drawLine(y)

    y = y - 25

    // Display each service in the order
    for (let item of order.items) {
        let service = findServiceForItem(item, services)

        if (service === null) {
            throw new Error('Service not found for an order item')
        }

        let serviceName = service.name || service.serviceName || 'Service'
        let quantity = Number(item.quantity)
        let unitPrice = Number(service.price)
        let itemTotal = quantity * unitPrice

        drawText(serviceName, 45, y, 10, regularFont)

        drawText(String(quantity), 275, y, 10, regularFont)

        drawText(formatMoney(unitPrice), 365, y, 10, regularFont)

        drawText(formatMoney(itemTotal), 475, y, 10, regularFont)

        y = y - 25

        if (y < 180) {
            page = pdfDocument.addPage([595, 842])
            y = 790
        }
    }

    // Pricing information
    y = y - 15

    drawLine(y)

    y = y - 30

    drawText(
        'Subtotal: ' + formatMoney(pricing.subtotal),
        350,
        y,
        11,
        regularFont
    )

    y = y - 22

    drawText(
        'Service Charge: ' + formatMoney(pricing.serviceCharge),
        350,
        y,
        11,
        regularFont
    )

    y = y - 22

    drawText(
        'Delivery Charge: ' + formatMoney(pricing.deliveryCharge),
        350,
        y,
        11,
        regularFont
    )

    y = y - 30

    drawLine(y)

    y = y - 30

    drawText(
        'TOTAL PAYABLE: ' + formatMoney(pricing.finalTotal),
        350,
        y,
        14,
        boldFont
    )

    // Footer
    y = 70

    drawLine(y)

    drawText(
        'Thank you for choosing our laundry service!',
        45,
        45,
        10,
        regularFont
    )

    // Save the PDF
    let invoicesDirectory = currentDirectory

    await fs.promises.mkdir(invoicesDirectory, {
        recursive: true
    })

    let fileName = 'invoice-' + order._id.toString() + '.pdf'

    let filePath = path.join(invoicesDirectory, fileName)

    let pdfBytes = await pdfDocument.save()

    await fs.promises.writeFile(filePath, pdfBytes)

    console.log('Invoice generated successfully!')
    console.log('Saved to: ' + filePath)

    return filePath
}

// Run the invoice generator only when this file is executed directly
let isMainFile = process.argv[1] &&
    path.resolve(process.argv[1]) === currentFile

if (isMainFile) {
    let orderId = process.argv[2]

    if (orderId) {
        generateInvoice(orderId).catch(function (error) {
            console.error('Invoice generation failed:', error.message)
        })
    } else {
        console.log('Please provide an order ID.')
        console.log('Example: node invoices/invoice.js YOUR_ORDER_ID')
    }
}

export { generateInvoice }
