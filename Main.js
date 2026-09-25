import console from 'console'
import * as fs from 'fs/promises'
import promptSyncModule from 'prompt-sync'

let dataBuffer2 = await fs.readFile('customers.json')
let customers = JSON.parse(dataBuffer2)
let dataBuffer3 = await fs.readFile('orders.json')
let orders = JSON.parse(dataBuffer3)
let prompt = promptSyncModule()

/**
 * Displays laundry services.
 */
async function showServices() {
    let dataBuffer = await fs.readFile('services.json', 'utf8')
    let services = JSON.parse(dataBuffer)

    console.log(
        "Service ID".padEnd(12) +
        "Service".padEnd(27) +
        "Unit".padEnd(9) +
        "Price"
    )

    console.log(
        "----------".padEnd(12) +
        "-------------------------".padEnd(27) +
        "--------".padEnd(9) +
        "-----"
    )

    for (var serv in services) {
        console.log(services[serv].serviceId.padEnd(12) + services[serv].name.padEnd(27) + services[serv].unit.padEnd(9) + services[serv].price.toFixed(2))

    }
}



/**
 * Calculates the total price of an order.
 *
 * @param {Object} order The order to calculate the total for.
 * @param {Array} services The list of available laundry services.
 * @returns {Number} The total price of the order.
 */

function calcTotal(order, services) {
    let total = 0
    for (var item in order.items) {
        for (var serv in services) {
            if (order.items[item].serviceId === services[serv].serviceId) {
                total += order.items[item].quantity * services[serv].price


            }
        }

    }
    return total
}

/**
 * Displays all orders for a customer.
 */
async function viewOrders() {
    let dataBuffer = await fs.readFile("services.json", "utf8")
    let services = JSON.parse(dataBuffer)

    let customerId = prompt("Enter customer ID: ")
    let customerFound = false

    for (var cust in customers) {
        if (customers[cust].customerId === customerId) {
            customerFound = true

            console.log("Orders for " + customers[cust].name)
            console.log(
                "Order ID".padEnd(12) +
                "Order Date".padEnd(15) +
                "Status".padEnd(12) +
                "Total"
            )

            console.log(
                "--------".padEnd(12) +
                "----------".padEnd(15) +
                "--------".padEnd(12) +
                "--------"
            )

            for (var order in orders) {
                if (orders[order].customerId === customerId) {
                    let total = calcTotal(orders[order], services)

                    console.log(
                        orders[order].orderId.padEnd(12) +
                        orders[order].orderDate.padEnd(15) +
                        orders[order].status.padEnd(12) +
                        total.toFixed(2)
                    )
                }
            }
        }
    }

    if (!customerFound) {
        console.log("This customer ID does not exist")
    }
}

/**
 * Updates the  order.
 */

async function updateOrder() {
    let orderId = prompt("Enter Order ID: ")

    for (var order in orders) {
        if (orders[order].orderId === orderId) {

            console.log("Current status: " + orders[order].status)

            let newStatus = prompt("Enter new status: ")

            let statusOrder = {
                Received: 1,
                Washing: 2,
                Ready: 3,
                Delivered: 4
            }

            if (statusOrder[newStatus] === undefined) {
                console.log("Invalid status")
                return
            }

            if (statusOrder[newStatus] <= statusOrder[orders[order].status]) {
                console.log("New status not accepted")
                return
            }

            orders[order].status = newStatus

            let output = JSON.stringify(orders, null, 4)
            await fs.writeFile("orders.json", output)

            console.log("Order status updated ")
            return
        }
    }

    console.log("Order not found")
}




/**
 * Creates a new laundry order.
 */
async function createOrder() {
    let customers = JSON.parse(await fs.readFile("customers.json"))
    let services = JSON.parse(await fs.readFile("services.json"))
    let orders = JSON.parse(await fs.readFile("orders.json"))

    let customerId = prompt("Enter customer ID: ")

    let customerFound = false

    for (let customer of customers) {
        if (customer.customerId === customerId) {
            customerFound = true
            break
        }
    }

    if (!customerFound) {
        console.log("Customer not found")
        return
    }

    let maxId = 0

    for (let order of orders) {
        let num = parseInt(order.orderId.substring(1))
        if (num > maxId) {
            maxId = num
        }
    }

    let items = []
    let total = 0

    while (true) {
        let serviceId = prompt("Enter service ID (blank to finish): ")

        if (serviceId === "") {
            if (items.length === 0) {
                console.log("Add at least one service")
                continue
            }

            break
        }

        let serviceFound = null

        for (let service of services) {
            if (service.serviceId === serviceId) {
                serviceFound = service
                break
            }
        }

        if (serviceFound === null) {
            console.log("Service not found")
            continue
        }

        let quantity = parseFloat(prompt("Enter quantity: "))

        if (isNaN(quantity) || quantity <= 0) {
            console.log("Invalid quantity")
            continue
        }

        items.push({
            serviceId: serviceId,
            quantity: quantity
        })

        total += serviceFound.price * quantity
    }

    let newOrder = {
        orderId: "O" + String(maxId + 1).padStart(3, "0"),
        customerId: customerId,
        orderDate: new Date().toISOString().split("T")[0],
        status: "Received",
        items: items
    }

    orders.push(newOrder)

    await fs.writeFile("orders.json", JSON.stringify(orders, null, 4))

    console.log("Order " + newOrder.orderId + " created")
    console.log("Total price: " + total.toFixed(2) + " QAR")
}

/**
 * the main
 */
while (true) {
    console.log("\n1. Show laundry services\n2. View customer orders\n3. Update order status\n4. Create new order\n5. Exit\n")

    let userChoice = prompt("What is your choice> ")

    if (userChoice == 1) {
        await showServices()
    } else if (userChoice == 2) {
        await viewOrders()
    } else if (userChoice == 3) {
        await updateOrder()
    } else if (userChoice == 4) {
        await createOrder()
    } else if (userChoice == 5) {
        console.log("Thank you, Bye!")
        break
    } else {
        console.log("Invalid choice")
    }
}