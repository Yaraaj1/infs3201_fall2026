import promptSyncModule from 'prompt-sync'

import {
    calcTotal,
    validateStatus,
    validateOrder,
    buildOrder,
    pricingRules
} from './businessLogic.js'

import {
    findCustomer,
    findService,
    findOrder,
    findOrdersByCustomer,
    getAllServices,
    getAllOrders,
    createOrder,
    updateOrder
} from './persistence.js'

let prompt = promptSyncModule()

/**
 * Displays all laundry services.
 *
 * @returns {Promise<void>} Displays the services.
 */
async function showServices() {
    let services = await getAllServices()

    console.log("Service ID".padEnd(11)+ "Service".padEnd(26)+ "Unit".padEnd(9) +"Price")
    console.log("---------- ------------------------- -------- --------")

    for (let service of services) {
        console.log(
            service.serviceId.padEnd(11) +
            service.name.padEnd(26) +
            service.unit.padEnd(9) +
            service.price.toFixed(2)
        )
    }
}

/**
 * Displays all orders belonging to a customer.
 *
 * @returns {Promise<void>} Displays the customer's orders.
 */
async function viewOrders() {
    let customerId = prompt("Enter customer ID: ")

    let customer = await findCustomer(customerId)

    if (customer === null) {
        console.log("Customer not found")
        return
    }

    let orders = await findOrdersByCustomer(customerId)
    let services = await getAllServices()

    console.log("Orders for " + customer.name)
    console.log("Order ID Order Date Status Total")
    console.log("-------- ---------- --------- --------")

    for (let order of orders) {
        let total = calcTotal(order, services)

        console.log(
            order.orderId.padEnd(9) +
            order.orderDate.padEnd(11) +
            order.status.padEnd(10) +
            total.toFixed(2)
        )
    }
}

/**
 * Updates the status of an order.
 *
 * @returns {Promise<void>} Updates the order status.
 */
async function updateOrderStatus() {
    let orderId = prompt("Enter order ID: ")

    let order = await findOrder(orderId)

    if (order === null) {
        console.log("Order not found")
        return
    }

    console.log("Current status: " + order.status)

    let newStatus = prompt("Enter new status: ")

    if (validateStatus(order.status, newStatus) === false) {
        console.log("New status not accepted")
        return
    }

    order.status = newStatus

    await updateOrder(orderId, order)

    console.log("Order status updated")
}

/**
 * Creates a new laundry order.
 *
 * @returns {Promise<void>} Creates a new order.
 */
async function createNewOrder() {
    let customerId = prompt("Enter customer ID: ")

    let customer = await findCustomer(customerId)

    if (customer === null) {
        console.log("Customer not found")
        return
    }

    let orders = await getAllOrders()

    let maxOrderNumber = 0

    for (let order of orders) {
        let orderNumber = Number(order.orderId.substring(1))

        if (orderNumber > maxOrderNumber) {
            maxOrderNumber = orderNumber
        }
    }

    let newOrderId = "O" + String(maxOrderNumber + 1).padStart(3, "0")

    let today = new Date()
    let year = today.getFullYear()
    let month = String(today.getMonth() + 1).padStart(2, "0")
    let day = String(today.getDate()).padStart(2, "0")
    let orderDate = year + "-" + month + "-" + day

    let services = await getAllServices()
    let items = []

    while (true) {
        let serviceId = prompt("Enter service ID (blank to finish): ")

        if (serviceId === "") {
            break
        }

        let service = await findService(serviceId)

        if (service === null) {
            console.log("Service not found")
            continue
        }

        let quantity = Number(prompt("Enter quantity: "))

        if (quantity <= 0) {
            console.log("Invalid quantity")
            continue
        }

        items.push({
            serviceId: serviceId,
            quantity: quantity
        })
    }

    if (validateOrder(items, services) === false) {
        console.log("Order must contain at least one valid service")
        return
    }

    let order = buildOrder(
        newOrderId,
        customerId,
        items,
        orderDate
    )

    let total = calcTotal(order, services)

    await createOrder(order)

    console.log("Order " + newOrderId + " created")
    console.log("Total price: " + total.toFixed(2) + " QAR")
}

/**
 * Displays the main application menu.
 *
 * @returns {Promise<void>} Runs the application menu.
 */
async function main() {
    while (true) {
        console.log("")
        console.log("1. Show laundry services")
        console.log("2. View customer orders")
        console.log("3. Update order status")
        console.log("4. Create new order")
        console.log("5. Exit")

        let choice = prompt("What is your choice> ")

        if (choice === "1") {
            await showServices()
        }
        else if (choice === "2") {
            await viewOrders()
        }
        else if (choice === "3") {
            await updateOrderStatus()
        }
        else if (choice === "4") {
            await createNewOrder()
        }
        else if (choice === "5") {
            console.log("Thank you, bye!")
            break
        }
        else {
            console.log("Invalid choice")
        }
    }
}

main()