
import express from 'express'
import { engine } from 'express-handlebars'

const app = express()
const PORT = 3000

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

app.listen(PORT, function () {
    console.log(`Server running at http://localhost:${PORT}`)
})
