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

/**
 * Finds a customer.
 */
async function getCustomer(customerId) {
    return await findCustomer(customerId)
}

/**
 * Finds a service.
 */
async function getService(serviceId) {
    return await findService(serviceId)
}

/**
 * Finds an order.
 */
async function getOrder(orderId) {
    return await findOrder(orderId)
}

/**
 * Gets all orders for a customer.
 *
 */
async function getCustomerOrders(customerId) {
    return await findOrdersByCustomer(customerId)
}

/**
 * Gets all laundry services.
 */
async function getServices() {
    return await getAllServices()
}

/**
 * Gets all orders.
 */
async function getOrders() {
    return await getAllOrders()
}

/**
 * Saves a new order.
 *
 */
async function saveOrder(order) {
    return await createOrder(order)
}

/**
 * Saves an updated order.
 *
 */
async function saveUpdatedOrder(orderId, order) {
    return await updateOrder(orderId, order)
}

/**
 * Gets the details and pricing information for an order.
 *
 * @param {String} orderId The order ID to find.
 * @param {Number} minimumOrderCharge The minimum order charge.
 * @param {Number} freeDeliveryThreshold The free delivery threshold.
 * @param {Number} deliveryCharge The delivery charge.
 * @returns {Object|null} The order details if found, otherwise null.
 */
async function getOrderDetails(
    orderId,
    minimumOrderCharge,
    freeDeliveryThreshold,
    deliveryCharge
) {
    let order = await findOrder(orderId)

    if (order === null) {
        return null
    }

    let customer = await findCustomer(order.customerId)
    let services = await getAllServices()

    let subtotal = calcTotal(order, services)

    let pricing = pricingRules(
        subtotal,
        minimumOrderCharge,
        freeDeliveryThreshold,
        deliveryCharge
    )

    return {
        order: order,
        customer: customer,
        services: services,
        pricing: pricing
    }
}




/**
 * Calculates the total price of an order.
 *
 * @param {Object} order The order to calculate.
 * @param {Array} services The available services.
 * @returns {Number} The total price of the order.
 */
function calcTotal(order, services) {
    let total = 0

    for (let item of order.items) {
        for (let service of services) {
            if (item.serviceId === service.serviceId) {
                total = total + item.quantity * service.price
            }
        }
    }

    return total
}

/**
 * Validates whether an order can move to a new status.
 *
 * @param {String} currentStatus The current order status.
 * @param {String} newStatus The new order status.
 * @returns {Boolean} True if the status change is valid, otherwise false.
 */
function validateStatus(currentStatus, newStatus) {
    let statusOrder = {
        Received: 1,
        Washing: 2,
        Ready: 3,
        Delivered: 4
    }

    if (statusOrder[currentStatus] === undefined) {
        return false
    }

    if (statusOrder[newStatus] === undefined) {
        return false
    }

    if (statusOrder[newStatus] <= statusOrder[currentStatus]) {
        return false
    }

    return true
}

/**
 * Validates the items in an order.
 *
 * @param {Array} items The order items.
 * @param {Array} services The available services.
 * @returns {Boolean} True if all items are valid, otherwise false.
 */
function validateOrder(items, services) {
    if (items.length === 0) {
        return false
    }

    for (let item of items) {
        let serviceFound = false

        for (let service of services) {
            if (item.serviceId === service.serviceId) {
                serviceFound = true
                break
            }
        }

        if (serviceFound === false || item.quantity <= 0) {
            return false
        }
    }

    return true
}

/**
 * Builds a new order object.
 *
 * @param {String} orderId The ID of the new order.
 * @param {String} customerId The ID of the customer.
 * @param {Array} items The items in the order.
 * @param {String} orderDate The order date.
 * @returns {Object} The new order.
 */
function buildOrder(orderId, customerId, items, orderDate) {
    let order = {
        orderId: orderId,
        customerId: customerId,
        orderDate: orderDate,
        status: "Received",
        items: items
    }

    return order
}

/**
 * Calculates the pricing details for an order.
 *
 * @param {Number} total The original subtotal of the order.
 * @param {Number} minimumOrderCharge The minimum service charge.
 * @param {Number} freeDeliveryThreshold The subtotal threshold for free delivery.
 * @param {Number} deliveryChargeAmount The delivery charge.
 * @returns {Object} The subtotal, service charge, delivery charge, and final total.
 */
function pricingRules(
    total,
    minimumOrderCharge,
    freeDeliveryThreshold,
    deliveryChargeAmount
) {
    let serviceCharge = total

    if (total < minimumOrderCharge) {
        serviceCharge = minimumOrderCharge
    }

    let deliveryCharge = 0

    if (total < freeDeliveryThreshold) {
        deliveryCharge = deliveryChargeAmount
    }

    let finalTotal = serviceCharge + deliveryCharge

    return {
        subtotal: total,
        serviceCharge: serviceCharge,
        deliveryCharge: deliveryCharge,
        finalTotal: finalTotal
    }
}

export {
    calcTotal,
    validateStatus,
    validateOrder,
    buildOrder,
    pricingRules,
    getOrderDetails,
    getCustomer,
    getService,
    getOrder,
    getCustomerOrders,
    getServices,
    getOrders,
    saveOrder,
    saveUpdatedOrder
}