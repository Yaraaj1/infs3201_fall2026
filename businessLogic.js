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
 * Calculates pricing rules for an order.
 *
 * @param {Number} total The original subtotal.
 * @returns {Object} The pricing information.
 */
function pricingRules(total) {
    let serviceCharge = total

    if (total < 25) {
        serviceCharge = 25
    }

    let deliveryCharge = 0

    if (total < 50) {
        deliveryCharge = 10
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
    pricingRules
}