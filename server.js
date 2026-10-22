
import express from 'express'
import { engine } from 'express-handlebars'

const app = express()
const PORT = 3000

// Configure Handlebars
app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.set('views', './views')

// Parse submitted form data
app.use(express.urlencoded({ extended: false }))

// Serve static files such as CSS
app.use(express.static('public'))

// Temporary route to test the server
app.get('/', function (req, res) {
    res.send('Express server is working!')
})

app.listen(PORT, function () {
    console.log(`Server running at http://localhost:${PORT}`)
})
