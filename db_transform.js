
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const client = new MongoClient(process.env.MONGODB_URI)

const database = client.db('infs3201_fall2026')

const customers = database.collection('customers')
const services = database.collection('services')
const orders = database.collection('orders')

/**
 * Converts application-generated identifiers to MongoDB ObjectIds.
 *
 * @returns {Promise<void>} Resolves when the migration is completed.
 */
async function transformDatabase() {
    let session = null

    try {
        await client.connect()

        console.log('Connected to MongoDB')

        let customerRecords = await customers.find({}).toArray()
        let serviceRecords = await services.find({}).toArray()
        let orderRecords = await orders.find({}).toArray()

        let customerMap = new Map()
        let serviceMap = new Map()

        // Check that the database has not already been migrated.
        for (let i = 0; i < customerRecords.length; i++) {
            if (typeof customerRecords[i].customerId !== 'string') {
                throw new Error('Customer identifiers are missing. Migration may have already run.')
            }

            customerMap.set(
                customerRecords[i].customerId,
                customerRecords[i]._id
            )
        }

        for (let i = 0; i < serviceRecords.length; i++) {
            if (typeof serviceRecords[i].serviceId !== 'string') {
                throw new Error('Service identifiers are missing. Migration may have already run.')
            }

            serviceMap.set(
                serviceRecords[i].serviceId,
                serviceRecords[i]._id
            )
        }

        for (let i = 0; i < orderRecords.length; i++) {
            if (typeof orderRecords[i].orderId !== 'string') {
                throw new Error('Order identifiers are missing. Migration may have already run.')
            }
        }

        // Validate unique customer and service identifiers.
        if (customerMap.size !== customerRecords.length) {
            throw new Error('Duplicate customer identifiers detected')
        }

        if (serviceMap.size !== serviceRecords.length) {
            throw new Error('Duplicate service identifiers detected')
        }

        // Validate all order references before changing the database.
        for (let i = 0; i < orderRecords.length; i++) {
            let order = orderRecords[i]

            if (!customerMap.has(order.customerId)) {
                throw new Error('Customer reference not found for order: ' + order.orderId)
            }

            if (!Array.isArray(order.items)) {
                throw new Error('Invalid items in order: ' + order.orderId)
            }

            for (let j = 0; j < order.items.length; j++) {
                let item = order.items[j]

                if (!serviceMap.has(item.serviceId)) {
                    throw new Error('Service reference not found in order: ' + order.orderId)
                }
            }
        }

        console.log('All database references validated successfully')

        // Start a transaction for the database changes.
        session = client.startSession()

        await session.withTransaction(async function () {

            // Remove application-generated customer IDs.
            for (let i = 0; i < customerRecords.length; i++) {
                await customers.updateOne(
                    { _id: customerRecords[i]._id },
                    { $unset: { customerId: '' } },
                    { session: session }
                )
            }

            // Remove application-generated service IDs.
            for (let i = 0; i < serviceRecords.length; i++) {
                await services.updateOne(
                    { _id: serviceRecords[i]._id },
                    { $unset: { serviceId: '' } },
                    { session: session }
                )
            }

            // Update order customer and service references.
            for (let i = 0; i < orderRecords.length; i++) {
                let order = orderRecords[i]
                let updatedItems = []

                for (let j = 0; j < order.items.length; j++) {
                    let updatedItem = Object.assign({}, order.items[j])

                    updatedItem.serviceId = serviceMap.get(
                        order.items[j].serviceId
                    )

                    updatedItems.push(updatedItem)
                }

                await orders.updateOne(
                    { _id: order._id },
                    {
                        $set: {
                            customerId: customerMap.get(order.customerId),
                            items: updatedItems
                        },
                        $unset: {
                            orderId: ''
                        }
                    },
                    { session: session }
                )
            }
        })

        console.log('Database migration completed successfully')

    } catch (error) {
        console.error('Database migration failed:', error)

    } finally {
        if (session !== null) {
            await session.endSession()
        }

        await client.close()
    }
}

transformDatabase()
