
import {
    findCustomer,
    findCustomerByPhone,
    findService,
    findOrder,
    findOrdersByCustomer,
    getAllServices,
    getAllOrders,
    createOrder,
    updateOrder
} from './persistence.js'

/**
 * Finds a customer by MongoDB ID.
 *
 * @param {string} customerId The customer's MongoDB ID.
 * @returns {Promise<Object|null>} The customer if found, otherwise null.
 */
async function getCustomer(customerId) {
    return await findCustomer(customerId)
}

/**
 * Finds a customer by phone number.
 *
 * @param {string} phoneNumber The phone number to find.
 * @returns {Promise<Object|null>} The customer if found, otherwise null.
 */
async function getCustomerByPhone(phoneNumber) {
    return await findCustomerByPhone(phoneNumber)
}

/**
 * Gets a laundry service by MongoDB ID.
 *
 * @param {string} serviceId The service's MongoDB ID.
 * @returns {Promise<Object|null>} The service if found, otherwise null.
 */
async function getService(serviceId) {
    return await findService(serviceId)
}

/**
 * Gets an order by MongoDB ID.
 *
 * @param {string} orderId The order's MongoDB ID.
 * @returns {Promise<Object|null>} The order if found, otherwise null.
 */
async function getOrder(orderId) {
    return await findOrder(orderId)
}

/**
 * Gets all orders belonging to a customer.
 *
 * @param {string} customerId The customer's MongoDB ID.
 * @returns {Promise<Array<Object>>} The customer's orders.
 */
async function getCustomerOrders(customerId) {
    return await findOrdersByCustomer(customerId)
}

/**
 * Gets all available laundry services.
 *
 * @returns {Promise<Array<Object>>} A list of laundry services.
 */
async function getServices() {
    return await getAllServices()
}

/**
 * Gets all orders in the system.
 *
 * @returns {Promise<Array<Object>>} A list of orders.
 */
async function getOrders() {
    return await getAllOrders()
}

/**
 * Saves a new order.
 *
 * @param {Object} order The order to save.
 * @returns {Promise<Object>} The saved order.
 */
async function saveOrder(order) {
    return await createOrder(order)
}

/**
 * Saves an updated order.
 *
 * @param {string} orderId The MongoDB ID of the order.
 * @param {Object} order The updated order information.
 * @returns {Promise<Object|null>} The updated order, or null if not found.
 */
async function saveUpdatedOrder(orderId, order) {
    return await updateOrder(orderId, order)
}

/**
 * Gets an order with its customer, services, and pricing information.
 *
 * @param {string} orderId The MongoDB ID of the order.
 * @param {number} minimumOrderCharge The minimum order charge.
 * @param {number} freeDeliveryThreshold The subtotal threshold for free delivery.
 * @param {number} deliveryCharge The delivery charge.
 * @returns {Promise<Object|null>} The order details, or null if not found.
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
 * Checks whether two MongoDB IDs are equal.
 *
 * @param {Object} firstId The first MongoDB ID.
 * @param {Object} secondId The second MongoDB ID.
 * @returns {Boolean} True if the IDs are equal.
 */
function idsAreEqual(firstId, secondId) {
    if (firstId === undefined || secondId === undefined) {
        return false
    }

    return firstId.toString() === secondId.toString()
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
            if (idsAreEqual(item.serviceId, service._id)) {
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
            if (idsAreEqual(item.serviceId, service._id)) {
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
 * @param {String} customerId The MongoDB ID of the customer.
 * @param {Array} items The items in the order.
 * @param {String} orderDate The order date.
 * @returns {Object} The new order.
 */
function buildOrder(customerId, items, orderDate) {
    let order = {
        customerId: customerId,
        orderDate: orderDate,
        status: 'Received',
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
    getCustomerByPhone,
    getService,
    getOrder,
    getCustomerOrders,
    getServices,
    getOrders,
    saveOrder,
    saveUpdatedOrder
}
