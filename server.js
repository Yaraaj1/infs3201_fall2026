
import 'dotenv/config'
import express from 'express'
import { engine } from 'express-handlebars'

import {
    getCustomerByPhone,
    getCustomerOrders,
    getServices,
    getOrders,
    getOrder,
    saveOrder,
    saveUpdatedOrder,
    validateStatus,
    validateOrder,
    buildOrder,
    calcTotal,
    pricingRules,
    authenticateUser,
    startUserSession,
    getUserSession,
    endUserSession
} from './businessLogic.js'

const app = express()
const PORT = 3001
const COOKIE_NAME = 'laundrySession'

const minimumOrderCharge = Number(process.env.MINIMUM_ORDER_CHARGE ?? 0)
const freeDeliveryThreshold = Number(process.env.FREE_DELIVERY_THRESHOLD ?? 0)
const deliveryCharge = Number(process.env.DELIVERY_CHARGE ?? 0)

app.engine('handlebars', engine({
    defaultLayout: 'main',
    helpers: {
        eq: function (firstValue, secondValue) {
            return firstValue === secondValue
        }
    }
}))

app.set('view engine', 'handlebars')
app.set('views', './views')

app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'))

/**
 * Gets the session token from the request cookie.
 *
 * @param {Object} req The Express request.
 * @returns {string|null} The session token, or null.
 */
function getSessionToken(req) {
    let cookieHeader = req.headers.cookie

    if (typeof cookieHeader !== 'string') {
        return null
    }

    let cookies = cookieHeader.split(';')

    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim()
        let separatorIndex = cookie.indexOf('=')

        if (separatorIndex === -1) {
            continue
        }

        let cookieName = cookie.substring(0, separatorIndex)
        let cookieValue = cookie.substring(separatorIndex + 1)

        if (cookieName === COOKIE_NAME) {
            try {
                return decodeURIComponent(cookieValue)
            } catch (error) {
                return null
            }
        }
    }

    return null
}

/**
 * Checks the user's MongoDB session on each request.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @param {Function} next The next middleware function.
 * @returns {Promise<void>} Checks the session and continues the request.
 */
async function checkUserSession(req, res, next) {
    let token = getSessionToken(req)

    req.session = null

    if (token === null) {
        return next()
    }

    try {
        let session = await getUserSession(token)

        if (session === null) {
            res.setHeader(
                'Set-Cookie',
                COOKIE_NAME + '=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax'
            )

            return next()
        }

        req.session = session

        res.setHeader(
            'Set-Cookie',
            COOKIE_NAME + '=' + encodeURIComponent(token) +
            '; Max-Age=600; Path=/; HttpOnly; SameSite=Lax'
        )

        return next()
    } catch (error) {
        console.error(error)
        return res.status(500).send('Unable to check login session')
    }
}

/**
 * Allows access only to logged-in staff users.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @param {Function} next The next middleware function.
 * @returns {void} Continues the request or sends a response.
 */
function requireStaff(req, res, next) {
    if (req.session === null) {
        return res.redirect('/login')
    }

    if (req.session.userType !== 'staff') {
        return res.status(403).send('Access denied')
    }

    next()
}

/**
 * Allows access only to logged-in customer users.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @param {Function} next The next middleware function.
 * @returns {void} Continues the request or sends a response.
 */
function requireCustomer(req, res, next) {
    if (req.session === null) {
        return res.redirect('/login')
    }

    if (req.session.userType !== 'customer') {
        return res.status(403).send('Access denied')
    }

    next()
}

/**
 * Makes the current session available to Handlebars views.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @param {Function} next The next middleware function.
 * @returns {void} Continues to the next middleware.
 */
function setSessionLocals(req, res, next) {
    res.locals.session = req.session
    next()
}

app.use(checkUserSession)
app.use(setSessionLocals)

/**
 * Displays the home page.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @returns {void} Renders the home page.
 */
function showHome(req, res) {
    res.render('home', {
        title: 'Laundry Service'
    })
}

app.get('/', showHome)

/**
 * Displays the login page.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @returns {void} Renders the login page or redirects.
 */
function showLogin(req, res) {
    if (req.session !== null) {
        return res.redirect('/welcome')
    }

    res.render('login', {
        title: 'Login'
    })
}

app.get('/login', showLogin)

/**
 * Checks login details and starts a session.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @returns {Promise<void>} Authenticates the user and redirects.
 */
async function loginUser(req, res) {
    if (
        typeof req.body.email !== 'string' ||
        typeof req.body.password !== 'string'
    ) {
        return res.status(400).render('login', {
            title: 'Login',
            error: 'Please enter your email and password'
        })
    }

    let email = req.body.email.trim().toLowerCase()
    let password = req.body.password

    if (email === '' || password === '') {
        return res.status(400).render('login', {
            title: 'Login',
            error: 'Please enter your email and password'
        })
    }

    try {
        let user = await authenticateUser(email, password)

        if (user === null) {
            return res.status(401).render('login', {
                title: 'Login',
                error: 'Invalid email or password'
            })
        }

        let token = await startUserSession(user)

        res.setHeader(
            'Set-Cookie',
            COOKIE_NAME + '=' + encodeURIComponent(token) +
            '; Max-Age=600; Path=/; HttpOnly; SameSite=Lax'
        )

        return res.redirect('/welcome')
    } catch (error) {
        console.error(error)
        return res.status(500).send('Unable to log in')
    }
}

app.post('/login', loginUser)

/**
 * Displays the user's type after successful login.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @returns {void} Renders the welcome page or redirects.
 */
function showWelcome(req, res) {
    if (req.session === null) {
        return res.redirect('/login')
    }

    res.render('welcome', {
        title: 'Welcome',
        userType: req.session.userType
    })
}

app.get('/welcome', showWelcome)

/**
 * Displays the correct dashboard for the logged-in user.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @returns {Promise<void>} Retrieves and renders the user's dashboard.
 */
async function showDashboard(req, res) {
    if (req.session === null) {
        return res.redirect('/login')
    }

    try {
        if (req.session.userType === 'customer') {
            let orders = await getCustomerOrders(req.session.userId)

            return res.render('dashboard', {
                title: 'My Dashboard',
                orders: orders
            })
        }

        if (req.session.userType === 'staff') {
            let orders = await getOrders()

            return res.render('staff-dashboard', {
                title: 'Staff Dashboard',
                orders: orders
            })
        }

        return res.status(403).send('Access denied')
    } catch (error) {
        console.error(error)
        return res.status(500).send('Unable to retrieve dashboard information')
    }
}

app.get('/dashboard', showDashboard)

/**
 * Logs the user out and deletes the session.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @returns {Promise<void>} Deletes the session and redirects.
 */
async function logoutUser(req, res) {
    let token = getSessionToken(req)

    try {
        if (token !== null) {
            await endUserSession(token)
        }

        res.setHeader(
            'Set-Cookie',
            COOKIE_NAME + '=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax'
        )

        return res.redirect('/login')
    } catch (error) {
        console.error(error)
        return res.status(500).send('Unable to log out')
    }
}

app.post('/logout', logoutUser)

/**
 * Displays all available laundry services.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @returns {Promise<void>} Retrieves and renders services.
 */
async function showServices(req, res) {
    try {
        let services = await getServices()

        return res.render('services', {
            title: 'Laundry Services',
            services: services
        })
    } catch (error) {
        console.error(error)
        return res.status(500).send('Unable to retrieve services')
    }
}

app.get('/services', showServices)

/**
 * Creates a new order for the logged-in customer.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @returns {Promise<void>} Validates, calculates, and saves the order.
 */
async function createCustomerOrder(req, res) {
    try {
        let services = await getServices()
        let items = []

        for (let service of services) {
            let fieldName = 'quantity_' + service._id.toString()
            let rawQuantity = req.body[fieldName]

            if (rawQuantity === undefined || rawQuantity === '') {
                continue
            }

            if (typeof rawQuantity !== 'string') {
                return res.status(400).render('services', {
                    title: 'Laundry Services',
                    services: services,
                    error: 'Invalid quantity entered'
                })
            }

            let quantity = Number(rawQuantity)

            if (!Number.isFinite(quantity) || quantity < 0) {
                return res.status(400).render('services', {
                    title: 'Laundry Services',
                    services: services,
                    error: 'Please enter valid quantities'
                })
            }

            if (quantity === 0) {
                continue
            }

            items.push({
                serviceId: service._id,
                quantity: quantity
            })
        }

        if (validateOrder(items, services) === false) {
            return res.status(400).render('services', {
                title: 'Laundry Services',
                services: services,
                error: 'Please select at least one valid service'
            })
        }

        let today = new Date()
        let year = today.getFullYear()
        let month = String(today.getMonth() + 1).padStart(2, '0')
        let day = String(today.getDate()).padStart(2, '0')
        let orderDate = year + '-' + month + '-' + day

        let order = buildOrder(
            req.session.userId,
            items,
            orderDate
        )

        let subtotal = calcTotal(order, services)

        let pricing = pricingRules(
            subtotal,
            minimumOrderCharge,
            freeDeliveryThreshold,
            deliveryCharge
        )

        let savedOrder = await saveOrder(order)
        let orders = await getCustomerOrders(req.session.userId)

        return res.render('dashboard', {
            title: 'My Dashboard',
            orders: orders,
            success: 'Your order was created successfully. Order ID: ' +
                savedOrder._id.toString() +
                '. Total: ' + pricing.finalTotal.toFixed(2) + ' QAR'
        })
    } catch (error) {
        console.error(error)
        return res.status(500).send('Unable to create your order')
    }
}

app.post('/orders', requireCustomer, createCustomerOrder)

/**
 * Displays all orders for staff users.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @returns {Promise<void>} Retrieves and renders all orders.
 */
async function showOrders(req, res) {
    try {
        let orders = await getOrders()

        return res.render('orders', {
            title: 'All Orders',
            orders: orders
        })
    } catch (error) {
        console.error(error)
        return res.status(500).send('Unable to retrieve orders')
    }
}

app.get('/orders', requireStaff, showOrders)

/**
 * Displays the order status update page for staff.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @returns {void} Renders the update status page.
 */
function showUpdateStatus(req, res) {
    res.render('update-status', {
        title: 'Update Order Status'
    })
}

app.get('/update-status', requireStaff, showUpdateStatus)

/**
 * Updates the status of an existing order.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @returns {Promise<void>} Validates and updates the order.
 */
async function updateOrderStatus(req, res) {
    if (
        typeof req.body.orderId !== 'string' ||
        typeof req.body.status !== 'string'
    ) {
        return res.status(400).send('Invalid order information')
    }

    let orderId = req.body.orderId.trim()
    let status = req.body.status

    if (orderId === '') {
        return res.status(400).send('Order ID is required')
    }

    try {
        let order = await getOrder(orderId)

        if (order === null) {
            return res.status(404).send('Order not found')
        }

        if (!validateStatus(order.status, status)) {
            return res.status(400).send('Invalid State')
        }

        order.status = status

        let updatedOrder = await saveUpdatedOrder(orderId, order)

        if (updatedOrder === null) {
            return res.status(404).send('Order not found')
        }

        return res.redirect('/orders')
    } catch (error) {
        console.error(error)
        return res.status(500).send('Unable to update order status')
    }
}

app.post('/update-status', requireStaff, updateOrderStatus)

/**
 * Displays the customer search page for staff.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @returns {void} Renders the customer search page.
 */
function showCustomerSearch(req, res) {
    res.render('customer', {
        title: 'Find Customer'
    })
}

app.get('/customer', requireStaff, showCustomerSearch)

/**
 * Finds a customer by phone number and displays their orders.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @returns {Promise<void>} Retrieves and renders customer information.
 */
async function searchCustomer(req, res) {
    if (typeof req.body.phone !== 'string') {
        return res.status(400).send('Customer phone number is required')
    }

    let phoneNumber = req.body.phone.trim()

    if (phoneNumber === '') {
        return res.status(400).send('Customer phone number is required')
    }

    try {
        let customer = await getCustomerByPhone(phoneNumber)

        if (customer === null) {
            return res.status(404).send('Customer not found')
        }

        let orders = await getCustomerOrders(customer._id)

        return res.render('customer', {
            title: 'Find Customer',
            customer: customer,
            orders: orders
        })
    } catch (error) {
        console.error(error)
        return res.status(500).send('Unable to retrieve customer information')
    }
}

app.post('/customer', requireStaff, searchCustomer)

/**
 * Handles requests for pages that do not exist.
 *
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @returns {void} Sends a 404 response.
 */
function showNotFound(req, res) {
    res.status(404).send('Page not found')
}

app.use(showNotFound)

/**
 * Starts the Express server.
 *
 * @returns {Object} The running HTTP server.
 */
function startServer() {
    return app.listen(PORT, function () {
        console.log(`Server running at http://localhost:${PORT}`)
    })
}

startServer()
