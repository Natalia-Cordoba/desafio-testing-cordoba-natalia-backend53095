import chai from 'chai'
import mongoose from 'mongoose'
import supertest from 'supertest'
import varenv from '../src/dotenv.js';
import { __dirname } from '../src/path.js'

const expect = chai.expect

await mongoose.connect(varenv.mongo_url)

const requester = supertest('http://localhost:8080')


// test para rutas de session 
describe('Rutas de sesiones de usuarios (Register, Login y Current)', function () {
    let user = {}
    let cookie = {}

    it('Ruta: api/session/register con el metodo POST', async () => {
        const newUser = {
            first_name: "Penelope",
            last_name: "Palacios",
            email: "penelope@example.com",
            password: "penelope1234",
            age: 22
        }

        const { body, statusCode } = await requester.post('/api/session/register').send(newUser)
        user = body?.payload
        user.password = newUser.password

        expect(statusCode).to.be.equal(200)

    })

    it('Ruta: api/session/login con el metodo POST', async () => {
        console.log(user)

        const result = await requester.post('/api/session/login').send(user)
        const cookieResult = result.headers['set-cookie'][0]

        cookie = {
            name: cookieResult.split("=")[0],
            value: cookieResult.split("=")[1].split(";")[0]
        }

        expect(cookie.name).to.be.ok.and.equal('connect.sid')
        expect(cookie.value).to.be.ok

    })

    it('Ruta: api/session/logout con el metodo GET', async () => {

        const logout = await requester.get('/api/session/logout').redirects(1)

        expect(logout.status).to.be.equal(200);
    })

})

