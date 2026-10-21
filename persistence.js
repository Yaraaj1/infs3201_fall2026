
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const client = new MongoClient(process.env.MONGODB_URI)

const database = client.db('infs3201_fall2026')

const customers = database.collection('customers')
const services = database.collection('services')
const orders = database.collection('orders')

let connectionPromise = null

/**
 * Connects to the MongoDB server.
 *
 * @returns {Promise<void>} A promise that resolves when connected.
 */
async function connectToDatabase() {
    if (connectionPromise === null) {
        connectionPromise = client.connect().catch(error => {
            connectionPromise = null
            throw error
        })
    }

    await connectionPromise
}

/**
 * Finds a customer by customer ID.
 *
 * @param {string} customerId The customer ID to find.
 * @returns {Promise<Object|null>} The customer if found, otherwise null.
 */
async function findCustomer(customerId) {
    await connectToDatabase()
    return await customers.findOne({ customerId: customerId })
}

/**
 * Finds a service by service ID.
 *
 * @param {string} serviceId The service ID to find.
 * @returns {Promise<Object|null>} The service if found, otherwise null.
 */
async function findService(serviceId) {
    await connectToDatabase()
    return await services.findOne({ serviceId: serviceId })
}

/**
 * Finds an order by order ID.
 *
 * @param {string} orderId The order ID to find.
 * @returns {Promise<Object|null>} The order if found, otherwise null.
 */
async function findOrder(orderId) {
    await connectToDatabase()
    return await orders.findOne({ orderId: orderId })
}

/**
 * Finds all orders belonging to a customer.
 *
 * @param {string} customerId The customer ID to search for.
 * @returns {Promise<Array<Object>>} The customer's orders.
 */
async function findOrdersByCustomer(customerId) {
    await connectToDatabase()
    return await orders.find({ customerId: customerId }).toArray()
}

/**
 * Gets all laundry services.
 *
 * @returns {Promise<Array<Object>>} All available laundry services.
 */
async function getAllServices() {
    await connectToDatabase()
    return await services.find({}).toArray()
}

/**
 * Gets all orders.
 *
 * @returns {Promise<Array<Object>>} All orders.
 */
async function getAllOrders() {
    await connectToDatabase()
    return await orders.find({}).toArray()
}

/**
 * Creates a new order.
 *
 * @param {Object} order The order to create.
 * @returns {Promise<Object>} The created order.
 */
async function createOrder(order) {
    await connectToDatabase()

    await orders.insertOne(order)

    return order
}

/**
 * Updates an existing order.
 *
 * @param {string} orderId The order ID to update.
 * @param {Object} updatedOrder The updated order information.
 * @returns {Promise<Object|null>} The updated order if found, otherwise null.
 */
async function updateOrder(orderId, updatedOrder) {
    await connectToDatabase()

    let result = await orders.updateOne(
        { orderId: orderId },
        {
            $set: {
                customerId: updatedOrder.customerId,
                orderDate: updatedOrder.orderDate,
                status: updatedOrder.status,
                items: updatedOrder.items
            }
        }
    )

    if (result.matchedCount === 0) {
        return null
    }

    return await orders.findOne({ orderId: orderId })
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
