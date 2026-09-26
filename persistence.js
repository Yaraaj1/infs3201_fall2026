import * as fs from 'fs/promises'

/**
 * Finds a customer by customer ID.
 *
 * @param {String} customerId The customer ID to find.
 * @returns {Object|null} The customer if found, otherwise null.
 */
async function findCustomer(customerId) {
    let data = await fs.readFile("customers.json", "utf8")
    let customers = JSON.parse(data)

    for (let customer of customers) {
        if (customer.customerId === customerId) {
            return customer
        }
    }

    return null
}

/**
 * Finds a service by service ID.
 *
 * @param {String} serviceId The service ID to find.
 * @returns {Object|null} The service if found, otherwise null.
 */
async function findService(serviceId) {
    let data = await fs.readFile("services.json", "utf8")
    let services = JSON.parse(data)

    for (let service of services) {
        if (service.serviceId === serviceId) {
            return service
        }
    }

    return null
}

/**
 * Finds an order by order ID.
 *
 * @param {String} orderId The order ID to find.
 * @returns {Object|null} The order if found, otherwise null.
 */
async function findOrder(orderId) {
    let data = await fs.readFile("orders.json", "utf8")
    let orders = JSON.parse(data)

    for (let order of orders) {
        if (order.orderId === orderId) {
            return order
        }
    }

    return null
}

/**
 * Finds all orders belonging to a customer.
 *
 * @param {String} customerId The customer ID to search for.
 * @returns {Array} The customer's orders.
 */
async function findOrdersByCustomer(customerId) {
    let data = await fs.readFile("orders.json", "utf8")
    let orders = JSON.parse(data)
    let customerOrders = []

    for (let order of orders) {
        if (order !== null && order.customerId === customerId) {
            customerOrders.push(order)
        }
    }

    return customerOrders
}

/**
 * Gets all laundry services.
 *
 * @returns {Array} All available laundry services.
 */
async function getAllServices() {
    let data = await fs.readFile("services.json", "utf8")
    let services = JSON.parse(data)

    return services
}

/**
 * Gets all orders.
 *
 * @returns {Array} All orders.
 */
async function getAllOrders() {
    let data = await fs.readFile("orders.json", "utf8")
    let orders = JSON.parse(data)

    return orders
}

/**
 * Creates a new order.
 *
 * @param {Object} order The order to create.
 * @returns {Object} The created order.
 */
async function createOrder(order) {
    let data = await fs.readFile("orders.json", "utf8")
    let orders = JSON.parse(data)

    orders.push(order)

    let updatedOrders = JSON.stringify(orders, null, 4)

    await fs.writeFile("orders.json", updatedOrders)

    return order
}

/**
 * Updates an existing order.
 *
 * @param {String} orderId The order ID to update.
 * @param {Object} updatedOrder The updated order.
 * @returns {Object|null} The updated order if found, otherwise null.
 */
async function updateOrder(orderId, updatedOrder) {
    let data = await fs.readFile("orders.json", "utf8")
    let orders = JSON.parse(data)

    for (let order of orders) {
        if (order.orderId === orderId) {
            order.customerId = updatedOrder.customerId
            order.orderDate = updatedOrder.orderDate
            order.status = updatedOrder.status
            order.items = updatedOrder.items

            let updatedOrders = JSON.stringify(orders, null, 4)

            await fs.writeFile("orders.json", updatedOrders)

            return order
        }
    }

    return null
}

export {
    findCustomer,
    findService,
    findOrder,
    findOrdersByCustomer,
    getAllServices,
    getAllOrders,
    createOrder,
    updateOrder
}