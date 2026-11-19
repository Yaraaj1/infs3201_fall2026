
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { getOrderDetails } from '../businessLogic.js'

dotenv.config({ override: true })

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)

// Design colors
const darkBlue = rgb(0.12, 0.22, 0.38)
const lightBlue = rgb(0.91, 0.95, 0.98)
const mediumBlue = rgb(0.75, 0.84, 0.91)
const darkText = rgb(0.18, 0.20, 0.23)
const white = rgb(1, 1, 1)
const grey = rgb(0.45, 0.48, 0.52)

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
 * Generates a professionally designed PDF invoice.
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

    const pageWidth = 595
    const pageHeight = 842
    const margin = 45

    let page = pdfDocument.addPage([pageWidth, pageHeight])
    let y = 790

    /**
     * Draws text on the current page.
     *
     * @param {string} text The text to display.
     * @param {number} x Horizontal position.
     * @param {number} yPosition Vertical position.
     * @param {number} size Font size.
     * @param {Object} font Font to use.
     * @param {Object} color Text color.
     */
    function drawText(
        text,
        x,
        yPosition,
        size,
        font,
        color = darkText
    ) {
        page.drawText(String(text), {
            x: x,
            y: yPosition,
            size: size,
            font: font,
            color: color
        })
    }

    /**
     * Draws a horizontal line.
     *
     * @param {number} yPosition Vertical position.
     */
    function drawLine(yPosition) {
        page.drawLine({
            start: { x: margin, y: yPosition },
            end: { x: pageWidth - margin, y: yPosition },
            thickness: 1,
            color: mediumBlue
        })
    }

    /**
     * Draws a light blue section background.
     *
     * @param {number} yPosition Vertical position.
     * @param {number} height Background height.
     */
    function drawSectionBackground(yPosition, height) {
        page.drawRectangle({
            x: margin,
            y: yPosition,
            width: pageWidth - (margin * 2),
            height: height,
            color: lightBlue
        })
    }

    /**
     * Formats a monetary amount.
     *
     * @param {number} amount Amount to format.
     * @returns {string} Formatted amount.
     */
    function formatMoney(amount) {
        return Number(amount).toFixed(2) + ' QAR'
    }

    /**
     * Adds a new page when more space is needed.
     */
    function addNewPage() {
        page = pdfDocument.addPage([pageWidth, pageHeight])
        y = 790

        drawText('LAUNDRY SERVICE', margin, y, 18, boldFont, darkBlue)

        y = y - 30

        drawText('INVOICE - CONTINUED', margin, y, 11, boldFont, grey)

        y = y - 25

        drawLine(y)

        y = y - 35
    }

    // --------------------------------------------------
    // HEADER
    // --------------------------------------------------

    page.drawRectangle({
        x: 0,
        y: 735,
        width: pageWidth,
        height: 107,
        color: darkBlue
    })

    drawText('LAUNDRY SERVICE', margin, 795, 22, boldFont, white)

    drawText('INVOICE', margin, 765, 14, regularFont, white)

    drawText(
        'Professional Laundry Services',
        340,
        785,
        10,
        regularFont,
        white
    )

    y = 710

    // --------------------------------------------------
    // ORDER INFORMATION
    // --------------------------------------------------

    drawSectionBackground(y - 75, 95)

    drawText('ORDER INFORMATION', 60, y, 12, boldFont, darkBlue)

    let invoiceNumber = order.orderId || order._id.toString()

    drawText('Order Number:', 60, y - 25, 10, boldFont)
    drawText(invoiceNumber, 160, y - 25, 10, regularFont)

    drawText('Order Date:', 60, y - 48, 10, boldFont)
    drawText(order.orderDate, 160, y - 48, 10, regularFont)

    drawText('Order Status:', 330, y - 25, 10, boldFont)
    drawText(order.status, 420, y - 25, 10, regularFont)

    y = y - 120

    // --------------------------------------------------
    // CUSTOMER INFORMATION
    // --------------------------------------------------

    drawText('CUSTOMER INFORMATION', margin, y, 12, boldFont, darkBlue)

    y = y - 15

    drawLine(y)

    y = y - 28

    let customerName = customer.name

    if (!customerName) {
        customerName = customer.firstName || ''

        if (customer.lastName) {
            customerName = customerName + ' ' + customer.lastName
        }
    }

    drawText('Name:', 60, y, 10, boldFont)
    drawText(customerName, 115, y, 10, regularFont)

    y = y - 22

    drawText('Email:', 60, y, 10, boldFont)
    drawText(
        customer.email || 'Not provided',
        115,
        y,
        10,
        regularFont
    )

    y = y - 22

    drawText('Phone:', 60, y, 10, boldFont)
    drawText(
        customer.phone || 'Not provided',
        115,
        y,
        10,
        regularFont
    )

    y = y - 40

    // --------------------------------------------------
    // ORDER DETAILS TABLE
    // --------------------------------------------------

    drawText('ORDER DETAILS', margin, y, 12, boldFont, darkBlue)

    y = y - 18

    drawLine(y)

    y = y - 28

    // Table header background
    page.drawRectangle({
        x: margin,
        y: y - 8,
        width: pageWidth - (margin * 2),
        height: 27,
        color: lightBlue
    })

    drawText('Service', 55, y, 10, boldFont, darkBlue)
    drawText('Quantity', 280, y, 10, boldFont, darkBlue)
    drawText('Unit Price', 365, y, 10, boldFont, darkBlue)
    drawText('Total', 480, y, 10, boldFont, darkBlue)

    y = y - 35

    // Display each service in the order
    for (let item of order.items) {
        if (y < 100) {
            addNewPage()
        }

        let service = findServiceForItem(item, services)

        if (service === null) {
            throw new Error('Service not found for an order item')
        }

        let serviceName = service.name || service.serviceName || 'Service'
        let quantity = Number(item.quantity)
        let unitPrice = Number(service.price)
        let itemTotal = quantity * unitPrice

        drawText(serviceName, 55, y, 10, regularFont)

        drawText(String(quantity), 290, y, 10, regularFont)

        drawText(formatMoney(unitPrice), 365, y, 10, regularFont)

        drawText(formatMoney(itemTotal), 470, y, 10, regularFont)

        y = y - 27

        drawLine(y + 10)

        y = y - 10
    }

    // --------------------------------------------------
    // PRICING SUMMARY
    // --------------------------------------------------

    if (y < 210) {
        addNewPage()
    }

    y = y - 10

    drawSectionBackground(y - 115, 145)

    drawText('PAYMENT SUMMARY', 350, y + 10, 12, boldFont, darkBlue)

    y = y - 25

    drawText('Subtotal:', 350, y, 10, regularFont)
    drawText(formatMoney(pricing.subtotal), 445, y, 10, regularFont)

    y = y - 23

    drawText('Service Charge:', 350, y, 10, regularFont)
    drawText(formatMoney(pricing.serviceCharge), 445, y, 10, regularFont)

    y = y - 23

    drawText('Delivery Charge:', 350, y, 10, regularFont)
    drawText(formatMoney(pricing.deliveryCharge), 445, y, 10, regularFont)

    y = y - 35

    // Highlighted final amount
    page.drawRectangle({
        x: 335,
        y: y - 12,
        width: 215,
        height: 35,
        color: darkBlue
    })

    drawText('TOTAL:', 350, y, 11, boldFont, white)

    drawText(
        formatMoney(pricing.finalTotal),
        420,
        y,
        11,
        boldFont,
        white
    )

    // --------------------------------------------------
    // FOOTER
    // --------------------------------------------------

    page.drawLine({
        start: { x: margin, y: 65 },
        end: { x: pageWidth - margin, y: 65 },
        thickness: 1,
        color: mediumBlue
    })

    drawText(
        'Thank you for choosing our laundry service!',
        margin,
        45,
        10,
        regularFont,
        grey
    )

    // --------------------------------------------------
    // SAVE PDF
    // --------------------------------------------------

    let invoicesDirectory = currentDirectory

    await fs.promises.mkdir(invoicesDirectory, {
        recursive: true
    })

    // A2 filename is different so the A1 invoice is preserved
    let fileName = 'invoiceA2-' + order._id.toString() + '.pdf'

    let filePath = path.join(invoicesDirectory, fileName)

    let pdfBytes = await pdfDocument.save()

    await fs.promises.writeFile(filePath, pdfBytes)

    console.log('A2 invoice generated successfully!')
    console.log('Saved to: ' + filePath)

    return filePath
}

// Run the invoice generator from the terminal
let orderId = process.argv[2]

if (orderId) {
    generateInvoice(orderId).catch(function (error) {
        console.error('Invoice generation failed:', error.message)
    })
} else {
    console.log('Please provide an order ID.')
    console.log('Example: node invoices/invoiceA2.js YOUR_ORDER_ID')
}

export { generateInvoice }
