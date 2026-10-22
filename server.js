
import express from 'express'
import { engine } from 'express-handlebars'

import {
    getCustomer,
    getCustomerOrders
} from './businessLogic.js'


const app = express()
const PORT = 3001

app.engine('handlebars', engine({
    defaultLayout: 'main'
}))

app.set('view engine', 'handlebars')
app.set('views', './views')

app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'))

app.get('/', function (req, res) {
    res.render('home', {
        title: 'Laundry Service'
    })
})


app.get('/customer', function (req, res) {
    res.render('customer', {
        title: 'Find Customer'
    })
})



app.post('/customer', async function (req, res) {
    let customerId = req.body.customerId.trim()

    if (customerId === '') {
        return res.status(400).send('Customer ID is required')
    }

    try {
        let customer = await getCustomer(customerId)

        if (customer === null) {
            return res.status(404).send('Customer not found')
        }

        let orders = await getCustomerOrders(customerId)

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



app.listen(PORT, function () {
    console.log(`Server running at http://localhost:${PORT}`)
})
