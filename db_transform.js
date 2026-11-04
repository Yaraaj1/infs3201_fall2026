
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const client = new MongoClient(process.env.MONGODB_URI)

const database = client.db('infs3201_fall2026')

const customers = database.collection('customers')
const services = database.collection('services')
const orders = database.collection('orders')

async function transformDatabase() {
    try {
        await client.connect()

        console.log('Connected to MongoDB')

        let customerRecords = await customers.find({}).toArray()
        let serviceRecords = await services.find({}).toArray()
        let orderRecords = await orders.find({}).toArray()

        let customerMap = new Map()
        let serviceMap = new Map()

        if (
            customerRecords.some(customer => customer.customerId === undefined) ||
            serviceRecords.some(service => service.serviceId === undefined) ||
            orderRecords.some(order => order.orderId === undefined)
        ) {
            throw new Error('Database appears to have already been migrated')
        }

        for (let customer of customerRecords) {
            customerMap.set(customer.customerId, customer._id)
        }

        for (let service of serviceRecords) {
            serviceMap.set(service.serviceId, service._id)
        }

        if (customerMap.size !== customerRecords.length) {
            throw new Error('Duplicate customer IDs detected')
        }

        if (serviceMap.size !== serviceRecords.length) {
            throw new Error('Duplicate service IDs detected')
        }

        for (let order of orderRecords) {
            if (!customerMap.has(order.customerId)) {
                throw new Error('Customer reference not found for order: ' + order._id)
            }

            if (!Array.isArray(order.items)) {
                throw new Error('Invalid items in order: ' + order._id)
            }

            for (let item of order.items) {
                if (!serviceMap.has(item.serviceId)) {
                    throw new Error('Service reference not found in order: ' + order._id)
                }
            }
        }

        console.log('All references validated successfully')

        let session = client.startSession()

        try {
            await session.withTransaction(async function () {

                for (let customer of customerRecords) {
                    await customers.updateOne(
                        { _id: customer._id },
                        { $unset: { customerId: '' } },
                        { session }
                    )
                }

                for (let service of serviceRecords) {
                    await services.updateOne(
                        { _id: service._id },
                        { $unset: { serviceId: '' } },
                        { session }
                    )
                }

                for (let order of orderRecords) {
                    let updatedItems = order.items.map(function (item) {
                        return {
                            serviceId: serviceMap.get(item.serviceId),
                            quantity: item.quantity
                        }
                    })

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
                        { session }
                    )
                }
            })

            console.log('Database migration completed successfully')

        } finally {
            await session.endSession()
        }

    } catch (error) {
        console.error('Database migration failed:', error)
    } finally {
        await client.close()
    }
}

transformDatabase()
