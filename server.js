
import express from 'express'
import { engine } from 'express-handlebars'

import {
    getCustomer,
    getCustomerByPhone,
    getCustomerOrders,
    getServices,
    getOrders,
    getOrder,
    saveUpdatedOrder,
    validateStatus,
    authenticateUser,
    startUserSession,
    getUserSession,
    endUserSession
} from './businessLogic.js'

const app = express()
const PORT = 3001
const COOKIE_NAME = 'laundrySession'

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
            return decodeURIComponent(cookieValue)
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


app.use(checkUserSession)
app.use(function (req, res, next) {
    res.locals.session = req.session
    next()
})

/**
 * Displays the home page.
 */
app.get('/', function (req, res) {
    res.render('home', {
        title: 'Laundry Service'
    })
})

/**
 * Displays the login page.
 */
app.get('/login', function (req, res) {
    if (req.session !== null) {
        return res.redirect('/welcome')
    }

    res.render('login', {
        title: 'Login'
    })
})

/**
 * Checks login details and starts a session.
 */
app.post('/login', async function (req, res) {
    let email = (req.body.email || '').trim().toLowerCase()
    let password = req.body.password || ''

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
})

/**
 * Displays the user's type after successful login.
 */
app.get('/welcome', function (req, res) {
    if (req.session === null) {
        return res.redirect('/login')
    }

    res.render('welcome', {
        title: 'Welcome',
        userType: req.session.userType
    })
})



/**
 * Displays the correct dashboard for the logged-in user.
 */
app.get('/dashboard', async function (req, res) {
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
        res.status(500).send('Unable to retrieve dashboard information')
    }
})


/**
 * Logs the user out and deletes the session.
 */
app.post('/logout', async function (req, res) {
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
})

app.get('/services', async function (req, res) {
    try {
        let services = await getServices()

        res.render('services', {
            title: 'Laundry Services',
            services: services
        })
    } catch (error) {
        console.error(error)
        res.status(500).send('Unable to retrieve services')
    }
})

app.get('/orders', requireStaff, async function (req, res) {
    try {
        let orders = await getOrders()

        res.render('orders', {
            title: 'All Orders',
            orders: orders
        })
    } catch (error) {
        console.error(error)
        res.status(500).send('Unable to retrieve orders')
    }
})

app.get('/update-status', requireStaff, function (req, res) {
    res.render('update-status', {
        title: 'Update Order Status'
    })
})

app.post('/update-status', requireStaff, async function (req, res) {
    let orderId = (req.body.orderId || '').trim()
    let status = req.body.status

    if (orderId === '') {
        return res.status(400).send('Order ID is required')
    }

    try {
        let order = await getOrder(orderId)

        if (order === null) {
            return res.status(404).send('Order not found')
        }

        if (typeof status !== 'string' || !validateStatus(order.status, status)) {
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
        res.status(500).send('Unable to update order status')
    }
})

app.get('/customer', requireStaff, function (req, res) {
    res.render('customer', {
        title: 'Find Customer'
    })
})

app.post('/customer', requireStaff, async function (req, res) {
    let phoneNumber = (req.body.phone || '').trim()

    if (phoneNumber === '') {
        return res.status(400).send('Customer phone number is required')
    }

    try {
        let customer = await getCustomerByPhone(phoneNumber)

        if (customer === null) {
            return res.status(404).send('Customer not found')
        }

        let orders = await getCustomerOrders(customer._id)

        res.render('customer', {
            title: 'Find Customer',
            customer: customer,
            orders: orders
        })
    } catch (error) {
        console.error(error)
        res.status(500).send('Unable to retrieve customer information')
    }
})

app.use(function (req, res) {
    res.status(404).send('Page not found')
})

app.listen(PORT, function () {
    console.log(`Server running at http://localhost:${PORT}`)
})
