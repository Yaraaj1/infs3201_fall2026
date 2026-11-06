
import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()

const client = new MongoClient(process.env.MONGODB_URI)

const database = client.db('infs3201_fall2026')

const customers = database.collection('customers')
const services = database.collection('services')
const orders = database.collection('orders')
const staffUsers = database.collection('staff_users')
const sessions = database.collection('sessions')

let connectionPromise = null

/**
 * Connects to the MongoDB server.
 *
 * @returns {Promise<void>} A promise that resolves when connected.
 */
async function connectToDatabase() {
    if (connectionPromise === null) {
        connectionPromise = client.connect()
    }

    try {
        await connectionPromise
    } catch (error) {
        connectionPromise = null
        throw error
    }
}

/**
 * Converts a string ID into a MongoDB ObjectId.
 *
 * @param {string|ObjectId} id The ID to convert.
 * @returns {ObjectId|null} The ObjectId if valid, otherwise null.
 */
function convertToObjectId(id) {
    if (id instanceof ObjectId) {
        return id
    }

    if (typeof id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return null
    }

    return new ObjectId(id)
}

/**
 * Finds a customer by MongoDB ID.
 *
 * @param {string|ObjectId} customerId The customer's MongoDB ID.
 * @returns {Promise<Object|null>} The customer if found, otherwise null.
 */
async function findCustomer(customerId) {
    await connectToDatabase()

    let objectId = convertToObjectId(customerId)

    if (objectId === null) {
        return null
    }

    return await customers.findOne({ _id: objectId })
}

/**
 * Finds a customer by phone number.
 *
 * @param {string} phoneNumber The phone number to find.
 * @returns {Promise<Object|null>} The customer if found, otherwise null.
 */
async function findCustomerByPhone(phoneNumber) {
    await connectToDatabase()

    return await customers.findOne({ phone: phoneNumber })
}

/**
 * Finds a customer by email address.
 *
 * @param {string} email The customer's email address.
 * @returns {Promise<Object|null>} The customer if found, otherwise null.
 */
async function findCustomerByEmail(email) {
    await connectToDatabase()

    return await customers.findOne({ email: email })
}

/**
 * Finds a staff user by email address.
 *
 * @param {string} email The staff user's email address.
 * @returns {Promise<Object|null>} The staff user if found, otherwise null.
 */
async function findStaffUserByEmail(email) {
    await connectToDatabase()

    return await staffUsers.findOne({ email: email })
}

/**
 * Creates a new login session.
 *
 * @param {Object} sessionData The session information.
 * @returns {Promise<string>} The session token.
 */
async function createSession(sessionData) {
    await connectToDatabase()

    let token = crypto.randomBytes(32).toString('hex')
    let tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    let session = {
        _id: tokenHash,
        userId: sessionData.userId,
        userType: sessionData.userType,
        email: sessionData.email,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }

    await sessions.insertOne(session)

    return token
}

/**
 * Finds a login session using its token.
 *
 * @param {string} token The session token.
 * @returns {Promise<Object|null>} The session if valid, otherwise null.
 */
async function findSession(token) {
    await connectToDatabase()

    if (typeof token !== 'string' || token === '') {
        return null
    }

    let tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    let session = await sessions.findOne({ _id: tokenHash })

    if (session === null) {
        return null
    }

    if (session.expiresAt <= new Date()) {
        await sessions.deleteOne({ _id: tokenHash })
        return null
    }

    return session
}

/**
 * Deletes a login session.
 *
 * @param {string} token The session token.
 * @returns {Promise<void>} A promise that resolves when deleted.
 */
async function deleteSession(token) {
    await connectToDatabase()

    if (typeof token !== 'string' || token === '') {
        return
    }

    let tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    await sessions.deleteOne({ _id: tokenHash })
}

/**
 * Finds a service by MongoDB ID.
 *
 * @param {string|ObjectId} serviceId The service's MongoDB ID.
 * @returns {Promise<Object|null>} The service if found, otherwise null.
 */
async function findService(serviceId) {
    await connectToDatabase()

    let objectId = convertToObjectId(serviceId)

    if (objectId === null) {
        return null
    }

    return await services.findOne({ _id: objectId })
}

/**
 * Finds an order by MongoDB ID.
 *
 * @param {string|ObjectId} orderId The order's MongoDB ID.
 * @returns {Promise<Object|null>} The order if found, otherwise null.
 */
async function findOrder(orderId) {
    await connectToDatabase()

    let objectId = convertToObjectId(orderId)

    if (objectId === null) {
        return null
    }

    return await orders.findOne({ _id: objectId })
}

/**
 * Finds all orders belonging to a customer.
 *
 * @param {string|ObjectId} customerId The customer's MongoDB ID.
 * @returns {Promise<Array<Object>>} The customer's orders.
 */
async function findOrdersByCustomer(customerId) {
    await connectToDatabase()

    let objectId = convertToObjectId(customerId)

    if (objectId === null) {
        return []
    }

    return await orders.find({ customerId: objectId }).toArray()
}

/**
 * Gets all laundry services.
 *
 * @returns {Promise<Array<Object>>} All available services.
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

    let customerObjectId = convertToObjectId(order.customerId)

    if (customerObjectId === null) {
        throw new Error('Invalid customer ID')
    }

    let newOrder = Object.assign({}, order)

    newOrder.customerId = customerObjectId
    newOrder.items = []

    for (let i = 0; i < order.items.length; i++) {
        let serviceObjectId = convertToObjectId(order.items[i].serviceId)

        if (serviceObjectId === null) {
            throw new Error('Invalid service ID')
        }

        let newItem = Object.assign({}, order.items[i])
        newItem.serviceId = serviceObjectId

        newOrder.items.push(newItem)
    }

    let result = await orders.insertOne(newOrder)

    newOrder._id = result.insertedId

    return newOrder
}

/**
 * Updates an existing order.
 *
 * @param {string|ObjectId} orderId The MongoDB ID of the order.
 * @param {Object} updatedOrder The updated order information.
 * @returns {Promise<Object|null>} The updated order if found, otherwise null.
 */
async function updateOrder(orderId, updatedOrder) {
    await connectToDatabase()

    let orderObjectId = convertToObjectId(orderId)
    let customerObjectId = convertToObjectId(updatedOrder.customerId)

    if (orderObjectId === null || customerObjectId === null) {
        return null
    }

    let updatedItems = []

    for (let i = 0; i < updatedOrder.items.length; i++) {
        let serviceObjectId = convertToObjectId(updatedOrder.items[i].serviceId)

        if (serviceObjectId === null) {
            return null
        }

        let updatedItem = Object.assign({}, updatedOrder.items[i])
        updatedItem.serviceId = serviceObjectId

        updatedItems.push(updatedItem)
    }

    let result = await orders.updateOne(
        { _id: orderObjectId },
        {
            $set: {
                customerId: customerObjectId,
                orderDate: updatedOrder.orderDate,
                status: updatedOrder.status,
                items: updatedItems
            }
        }
    )

    if (result.matchedCount === 0) {
        return null
    }

    return await orders.findOne({ _id: orderObjectId })
}

export {
    findCustomer,
    findCustomerByPhone,
    findCustomerByEmail,
    findStaffUserByEmail,
    createSession,
    findSession,
    deleteSession,
    findService,
    findOrder,
    findOrdersByCustomer,
    getAllServices,
    getAllOrders,
    createOrder,
    updateOrder
}
