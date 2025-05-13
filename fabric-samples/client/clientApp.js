// const create = require('kubo-rpc-client');
const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../sdk/app.js');
// const { initialize } = require('@zokrates-js/core');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { promisify } = require('util');
// const { ZoKratesProvider } = require('zokrates-js');
// const { ipfs, getFile } = require('../ipfs/file.js'); 
// const IPFS = require('ipfs-http-client');
const snarkjs = require('snarkjs');
const User = require('../sdk/user.js')
const fs = require('fs')
const crypto = require('crypto');
const { poseidon1 } = require('poseidon-lite');
const FILES_DIR = path.resolve(__dirname, './uploads/patient');
const walletPath_org1 = path.join(__dirname, '../sdk/wallet_Org1')
const walletPath_org2 = path.join(__dirname, '../sdk/wallet_Org2')
const walletPath_org3 = path.join(__dirname, '../sdk/wallet_Org3')
require('dotenv').config();

// const ipfs = create(new URL('http://127.0.0.1:5002'));
// const ipfs = IPFS.create({ host: '127.0.0.1', port: '5002', protocol: 'http' });
const clientApp = express();
clientApp.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
clientApp.use(morgan('combined'));
clientApp.use(bodyParser.json());
clientApp.use(cors({
  origin: 'http://main.infili.com:4200', 
  // origin: 'https://keycloak.netoperis.com',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, 
}));


clientApp.use(bodyParser.urlencoded({
  extended: true
}));

clientApp.use(express.json());
clientApp.use(express.urlencoded({ extended: true }));

// const credentials = require('./credentials.json')
clientApp.listen(5001, () => console.log(`[+++] Backend server running on port 5001 [+++]`));

/**
 * @swagger
 * components:
 *   schemas:
 *     UserCredentials:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *     LoginResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         role:
 *           type: string
 *         org:
 *           type: string
 *     GeneralResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 */


// function fetchCredentials(username, obj) {
//   const cred = credentials[username]
//   var param = obj;
//   if (cred) {
//     if (param == "password") {
//       return cred.password;
//     }
//     else if (param == "role") {
//       return cred.role;
//     }
//   }
//   else {
//     return ""
//   }
// }

/**
 * Method to authenticate the access token generated.
 */
// const authenticateJWT = (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (authHeader) {
//     const token = authHeader.split(' ')[1];

//     const query = 'SELECT password FROM users WHERE username = ?';

//     pool.getConnection((err, connection) => {
//       if (err) {
//         return res.status(500).json({ error: 'Error acquiring database connection' });
//       }

//       connection.query(query, [req.body.username], (error, results) => {
//         connection.release();

//         if (error) {
//           return res.status(500).json({ error: 'Error executing database query' });
//         }

//         if (results.length === 1) {
//           const dbPassword = results[0].password;

//           jwt.verify(token, dbPassword, (err, user) => {
//             if (err) {
//               console.log(err);
//               console.log(dbPassword);
//               return res.sendStatus(403);
//             }
//             req.user = user;
//             next();
//           });
//         } else {
//           res.sendStatus(403); 
//         }
//       });
//     });
//   } else {
//     res.sendStatus(401);
//   }
// };

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.log("❌ JWT verification failed:", err.message);
        return res.sendStatus(403); // Forbidden
      }

      req.user = user; 
      next();
    });

  } else {
    res.sendStatus(401);
  }
};


/**
 * Login to the application and the username and password is validated.
 */


const pool = mysql.createPool({
  host: 'main.infili.com',
  user: 'root',
  password: 'red5PRO@action',
  database: 'hospitalInfo',
  port: 3306,
  waitForConnections: true,
  debug: false,
});

/**
 * @swagger
 * /downloadFile:
 *   post:
 *     summary: Downloads a file for a user with appropriate permissions.
 *     description: >
 *       This endpoint allows a doctor to download a patient's file from the system,
 *       provided they have the necessary permissions. The file will be decrypted
 *       on the server before being sent to the requester. Requires JWT authentication.
 *     tags: [File Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: The name of the file to download.
 *     responses:
 *       200:
 *         description: File downloaded successfully. The file is sent as a stream in the response body.
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Request was malformed, typically indicating missing required parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Authentication token is missing or the user does not have permission to download the file.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: The specified file could not be found on the server.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server encountered an error processing the download request.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: A human-readable description of the error.
 */


clientApp.post('/downloadFile', async (req, res) => {
  const { fileName } = req.body;

  if (!fileName) {
    return res.status(400).send('Filename is required in the request body.');
  }

  const filePath = path.join(FILES_DIR, fileName);

  // Check if file exists using fs.access for better practice
  fs.access(filePath, fs.constants.F_OK, async (err) => {
    if (err) {
      return res.status(404).send('File not found');
    }
    try {
      const userObj = new User(req.body)
      if (userObj.role === "doctor") {
        if (userObj.org == "Org1") {
          await app.readDownloadsFromLedger(userObj, walletPath_org1);
          const detailsString = await app.queryHash(userObj);
          const details = JSON.parse(detailsString);

          // const ipfsResponse = await fetch(`https://ipfs.io/ipfs/${details.fileHash}`);
          const ipfsResponse = await fetch(`http://172.18.0.17:8080/ipfs/${details.fileHash}`);
          if (!ipfsResponse.ok) throw new Error('Failed to download file from IPFS');
          const arrayBuffer = await ipfsResponse.arrayBuffer();
          const encryptedFileBuffer = Buffer.from(arrayBuffer);

          const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(details.enc_key, 'hex'), Buffer.from(details.i_vector, 'hex'));
          const decrypted = Buffer.concat([decipher.update(encryptedFileBuffer), decipher.final()]);

          const tempFilePath = path.join(FILES_DIR, `decrypted-${fileName}`);
          await promisify(fs.writeFile)(tempFilePath, decrypted);

          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Content-Type', 'application/octet-stream'); // Consider setting specific MIME type if known
          const readStream = fs.createReadStream(tempFilePath);
          readStream.on('end', () => fs.unlinkSync(tempFilePath)); // Clean up the temp file after sending
          readStream.pipe(res);
        }
        else if (userObj.org == "Org2") {
          app.readDownloadsFromLedger(userObj, walletPath_org2);
          await app.readDownloadsFromLedger(userObj, walletPath_org1);
          const detailsString = await app.queryHash(userObj);
          const details = JSON.parse(detailsString);

          const ipfsResponse = await fetch(`https://ipfs.io/ipfs/${details.fileHash}`);
          if (!ipfsResponse.ok) throw new Error('Failed to download file from IPFS');
          const arrayBuffer = await ipfsResponse.arrayBuffer();
          const encryptedFileBuffer = Buffer.from(arrayBuffer);

          const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(details.enc_key, 'hex'), Buffer.from(details.i_vector, 'hex'));
          const decrypted = Buffer.concat([decipher.update(encryptedFileBuffer), decipher.final()]);

          const tempFilePath = path.join(FILES_DIR, `decrypted-${fileName}`);
          await promisify(fs.writeFile)(tempFilePath, decrypted);

          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Content-Type', 'application/octet-stream'); // Consider setting specific MIME type if known
          const readStream = fs.createReadStream(tempFilePath);
          readStream.on('end', () => fs.unlinkSync(tempFilePath)); // Clean up the temp file after sending
          readStream.pipe(res);
        }
        else if (userObj.org == "Org3") {
          app.readDownloadsFromLedger(userObj, walletPath_org3);
          await app.readDownloadsFromLedger(userObj, walletPath_org1);
          const detailsString = await app.queryHash(userObj);
          const details = JSON.parse(detailsString);

          const ipfsResponse = await fetch(`https://ipfs.io/ipfs/${details.fileHash}`);
          if (!ipfsResponse.ok) throw new Error('Failed to download file from IPFS');
          const arrayBuffer = await ipfsResponse.arrayBuffer();
          const encryptedFileBuffer = Buffer.from(arrayBuffer);

          const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(details.enc_key, 'hex'), Buffer.from(details.i_vector, 'hex'));
          const decrypted = Buffer.concat([decipher.update(encryptedFileBuffer), decipher.final()]);

          const tempFilePath = path.join(FILES_DIR, `decrypted-${fileName}`);
          await promisify(fs.writeFile)(tempFilePath, decrypted);

          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Content-Type', 'application/octet-stream'); // Consider setting specific MIME type if known
          const readStream = fs.createReadStream(tempFilePath);
          readStream.on('end', () => fs.unlinkSync(tempFilePath)); // Clean up the temp file after sending
          readStream.pipe(res);
        }
      }
    } catch (error) {
      console.error('Error downloading or decrypting file:', error);
      res.status(500).json({ error: 'Error processing your download request.' });
    }
  });
});


/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login to the application and validate username and password.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCredentials'
 *     responses:
 *       200:
 *         description: Login successful, returns JWT.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid username or password.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
clientApp.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ?';

  let connection;
  try {
    connection = await pool.promise().getConnection(); 

    const [results] = await connection.query(query, [username]);
    if (results.length === 1) {
      const user = results[0];

      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        const accessToken = jwt.sign(
          { username: username, role: user.role }, 
          process.env.JWT_SECRET, 
          { expiresIn: '1h' } 
        );

        res.json({ accessToken, role: user.role, org: user.org, firstLogin: user.firstLogin });
      } else {
        res.status(400).json({ error: 'Invalid Username or Password' });
      }
    } else {
      res.status(400).json({ error: 'Invalid Username or Password' });
    }
  } catch (error) {
    console.error(`❌ Login error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

// clientApp.post('/login', (req, res) => {
//   const { username, password } = req.body;

//   const query = 'SELECT * FROM users WHERE username = ?';

//   pool.getConnection((err, connection) => {
//     if (err) {
//       return res.status(500).json({ error: 'Error acquiring database connection' });
//     }

//     connection.query(query, [username], (error, results) => {

//       connection.release();

//       if (error) {
//         return res.status(500).json({ error: 'Error executing database query' });
//       }

//       if (results.length === 1) {
//         const user = results[0];


//         if (password === user.password) {
//           const accessToken = jwt.sign({ username: username, role: user.role }, user.password);
//           res.json({ accessToken, role: user.role, org: user.org });

//         } else {
//           res.status(400).json({ error: 'Invalid Username or Password' });
//         }
//       } else {
//         res.status(400).json({ error: 'Invalid Username or Password' });
//       }
//     });
//   });
// });

// Close the MySQL connection on server shutdown
// process.on('SIGINT', () => {
//   connection.end();
//   process.exit();
// });

process.on('SIGINT', () => {
  pool.end((err) => {
    if (err) {
      console.error('Error closing MySQL pool:', err);
    } else {
      console.log('MySQL pool closed');
    }
    process.exit();
  });
});


/**
 * Invoke registration for the doctor. Carried out one time by the admin.
 * As the username and password of the admin is needed to enroll.
 */

/**
 * @swagger
 * /registerDoctor:
 *   post:
 *     summary: Register a new doctor in the system.
 *     tags: [Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doctorName:
 *                 type: string
 *               speciality:
 *                 type: string
 *     responses:
 *       200:
 *         description: Doctor registration successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GeneralResponse'
 *       500:
 *         description: Error in registration process.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

clientApp.post('/registerDoctor', authenticateJWT, async (req, res) => {
  const doctorObj = new User(req.body)
  const response = await app.registerDoctor(doctorObj);
  if (response.error) {
    res.send(response.error);
  } else {
    res.send(JSON.stringify(response));
  }
});

clientApp.post('/queryAllRegistrations', async (req, res) => {
  try {
    const adminObj = new User(req.body)
    const doctorRegistrations = await app.queryAllRegistrations(adminObj);
    res.json(doctorRegistrations);
  } catch (error) {
    console.error('Error querying doctor registrations:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

clientApp.post('/queryAllSpecificDoctorUpdates', async (req, res) => {
  try {
    const adminObj = new User(req.body)
    const doctorRegistrations = await app.queryAllSpecificDoctorUpdates(adminObj);
    res.json(doctorRegistrations);
  } catch (error) {
    console.error('Error querying doctor registrations:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

clientApp.post('/queryAllUploads', async (req, res) => {
  try {
    const adminObj = new User(req.body)
    const doctorRegistrations = await app.queryAllUploads(adminObj);
    res.json(doctorRegistrations);
  } catch (error) {
    console.error('Error querying patient records uploads:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

clientApp.post('/queryAllDownloads', async (req, res) => {
  try {
    const adminObj = new User(req.body)
    const doctorRegistrations = await app.queryAllDownloads(adminObj);
    res.json(doctorRegistrations);
  } catch (error) {
    console.error('Error querying patient records downloads:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

clientApp.post('/queryAllUpdatedData', async (req, res) => {
  try {
    const adminObj = new User(req.body)
    const doctorRegistrations = await app.queryAllUpdatedData(adminObj);
    res.json(doctorRegistrations);
  } catch (error) {
    console.error('Error querying doctor registrations:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

clientApp.post('/queryAllDoctorReads', async (req, res) => {
  try {
    const adminObj = new User(req.body)
    const doctorRegistrations = await app.queryAllDoctorReads(adminObj);
    res.json(doctorRegistrations);
  } catch (error) {
    console.error('Error querying doctor reads:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

clientApp.post('/queryAllPatientGrantsToDoctors', async (req, res) => {
  try {
    const adminObj = new User(req.body)
    const doctorRegistrations = await app.queryAllPatientGrantsToDoctors(adminObj);
    res.json(doctorRegistrations);
  } catch (error) {
    console.error('Error querying doctor reads:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

clientApp.post('/queryAllPatientGrantsToResearchers', async (req, res) => {
  try {
    const adminObj = new User(req.body)
    const doctorRegistrations = await app.queryAllPatientGrantsToResearchers(adminObj);
    res.json(doctorRegistrations);
  } catch (error) {
    console.error('Error querying doctor reads:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

clientApp.post('/queryAllPatientRevokesToDoctors', async (req, res) => {
  try {
    const adminObj = new User(req.body)
    const doctorRegistrations = await app.queryAllPatientRevokesToDoctors(adminObj);
    res.json(doctorRegistrations);
  } catch (error) {
    console.error('Error querying doctor reads:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// IPFS HASH
clientApp.post('/queryHash', async (req, res) => {
  try {
    const userObj = new User(req.body)
    const hash = await app.queryHash(userObj);
    res.json(hash);
  } catch (error) {
    console.error('Error querying hash:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

clientApp.post('/queryAllPatientRevokesToResearchers', async (req, res) => {
  try {
    const adminObj = new User(req.body)
    const doctorRegistrations = await app.queryAllPatientRevokesToResearchers(adminObj);
    res.json(doctorRegistrations);
  } catch (error) {
    console.error('Error querying doctor reads:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * Invoke registration for patient methods and add the patient data to the ledger. 
 * Registration is carried out only once by doctor/admin (preferably admin).
 * As the username and password of the admin/doctor is needed to enroll.
 */
clientApp.post('/registerPatient', authenticateJWT, async (req, res) => {
  const patientObj = new User(req.body)
  const response = await app.registerPatient(patientObj);
  console.log(response);
  if (response.error) {
    res.send(response.error);
  } else {
    res.send(JSON.stringify(response));
  }
});

// Invoke registration for the researcher. Carried out one time by the admin.

clientApp.post('/registerResearcher', authenticateJWT, async (req, res) => {
  const researcherObj = new User(req.body)
  const response = await app.registerResearcher(researcherObj);
  console.log(response)
  if (response.error) {
    res.send(response.error);
  } else {
    res.send(JSON.stringify(response));
  }
});


clientApp.post('/postEncryptedData', async (req, res) => {
  try {
    const encryptedData = req.body;
    res.json({ result: encryptedData });
  } catch (error) {
    console.error('Error processing encrypted data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


/**
 * Update patient's non-medical information.
 */
// clientApp.post('/updatePatientInfo', authenticateJWT, async (req, res) => {
// 	const patientObj = new User(req.body)
// 	const response = await app.updatePatientInfo(patientObj)
// 	if (response.error) {
//     res.send(response.error);
//   } else {
//     res.send(response);
//   }
// });

// clientApp.post('/updateResearcherInfo', authenticateJWT, async (req, res) => {
// 	const patientObj = new User(req.body)
// 	const response = await app.updateResearcherInfo(patientObj)
// 	if (response.error) {
//     res.send(response.error);
//   } else {
//     res.send(response);
//   }
// });

/**
 * Update patient's medical information
 */
clientApp.post('/updatePatientHealthRecord', authenticateJWT, async (req, res) => {
  const patientObj = new User(req.body)
  const response = await app.updatePatientHealthRecord(patientObj)
  if (response.error) {
    res.send(response.error)
  } else {
    res.send(response)
  }
});

clientApp.post('/requestAccess', authenticateJWT, async (req, res) => {
  const doctorObj = new User(req.body)
  const response = await app.requestAccess(doctorObj)
  if (response.error) {
    res.send(response.error)
  } else {
    res.send(response)
  }
});

clientApp.post('/changeStatus', authenticateJWT, async (req, res) => {
  const doctorObj = new User(req.body)
  const response = await app.changeStatus(doctorObj)
  if (response.error) {
    res.send(response.error)
  } else {
    res.send(response)
  }
});


// POST endpoint for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destinationFolder = 'uploads/patient';
    if (!fs.existsSync(destinationFolder)) {
      fs.mkdirSync(destinationFolder, { recursive: true });
      console.log('Folder created:', destinationFolder);
    }
    cb(null, destinationFolder);
  },
  filename: (req, file, cb) => {
    const patientId = req.query.patientId; // Extract patientId from query
    if (!patientId) {
      return cb(new Error('Patient ID is missing.'));
    }
    const originalFileName = path.parse(file.originalname).name;
    const fileExtension = path.extname(file.originalname);
    // Create a filename with patientId, original filename, and file extension
    const fileName = `patient${patientId}-${originalFileName}${fileExtension}`;
    cb(null, fileName);
    console.log('File name:', fileName);
    req.generatedFileName = fileName; // Store generated file name in the request object
    req.patientId = patientId; // Store patientId in the request object
  },
});

const fileFilter = (req, file, cb) => {
  // Assuming the client sends 'patientId' as part of the form data before the file
  if (req.body.patientId) {
    req.patientId = req.body.patientId;
  }
  // Accept the file:
  cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

/**
 * @swagger
 * /uploadFileEndpoint:
 *   post:
 *     summary: Uploads a file associated with a patient ID.
 *     description: >
 *       This endpoint allows a doctor or authorized user to upload a file for a specific patient.
 *       The file is encrypted on the server before being stored or processed further.
 *       Requires JWT authentication for verifying the user's role and permissions.
 *     tags: [File Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: string
 *                 description: The ID of the patient to whom the file belongs.
 *               fileUpload:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload.
 *     responses:
 *       200:
 *         description: File uploaded and encrypted successfully. Returns the path of the uploaded file.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *                 filePath:
 *                   type: string
 *                   description: Path of the uploaded file on the server.
 *       400:
 *         description: Bad request, possibly due to missing patientId or file.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: User does not have permission to upload files.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server encountered an error processing the upload request.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: A human-readable description of the error.
 */



clientApp.post('/uploadFileEndpoint', upload.single('fileUpload'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('No file uploaded.');
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const encryptionKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const start = process.hrtime.bigint();

    function encryptBuffer(buffer) {
      const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
      const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
      return encrypted;
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const encryptedFileBuffer = encryptBuffer(fileBuffer);

    const end_enc = process.hrtime.bigint();
    console.log(`Encryption Time: ${(end_enc - start) / BigInt(1e6)}ms`);

    const { ipfs, getFile } = await import('../ipfs/file.mjs');
    // Upload file to IPFS
    const added = await ipfs.add(encryptedFileBuffer, { pin: true });
    const ipfsHash = added.cid.toString();
    console.log(`File uploaded to IPFS with hash: ${ipfsHash}`);

    // Access patientId and generatedFileName from the request object
    const patientId = req.patientId;
    const generatedFileName = req.generatedFileName;

    // Upload file to Server
    const filePath = req.file.path;
    console.log('File uploaded:', filePath);
    const end_file_upload = process.hrtime.bigint();
    console.log(`Encryption Time + Uploading Time: ${(end_file_upload - start) / BigInt(1e6)}ms`);

    try {
      const doctorObj = new User(req.body);
      const encryptionKeyHex = encryptionKey.toString('hex');
      const ivHex = iv.toString('hex');

      if (doctorObj.org == "Org1") {
        app.writeHashToLedger(doctorObj, generatedFileName, ipfsHash, patientId, encryptionKeyHex, ivHex, walletPath_org1);
        app.readUploadsFromLedger(doctorObj, walletPath_org1);
      } else if (doctorObj.org == "Org2") {
        app.writeHashToLedger(doctorObj, generatedFileName, ipfsHash, patientId, encryptionKeyHex, ivHex, walletPath_org2);
        app.readUploadsFromLedger(doctorObj, walletPath_org2);
      } else if (doctorObj.org == "Org3") {
        app.writeHashToLedger(doctorObj, generatedFileName, ipfsHash, patientId, encryptionKeyHex, ivHex, walletPath_org3);
        app.readUploadsFromLedger(doctorObj, walletPath_org3);
      }
      console.log(`readUploadsFromLedger() -> Submitted transaction readUploadsFromLedger`);
      res.status(200).json({ message: 'File uploaded successfully.', filePath: filePath });
    } catch (error) {
      console.error(`Failed to submit transaction readUploadsFromLedger: ${error}`);
      res.status(500).json({ error: 'Failed to process uploaded file.' });
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file.' });
  }
});


// clientApp.post('/uploadFileEndpoint', upload.single('fileUpload'), (req, res) => {
//   try {
//     if (!req.file) {
//       console.log('No file uploaded.');
//       return res.status(400).json({ error: 'No file uploaded.' });
//     }

//     const filePath = req.file.path;
//     console.log('File uploaded:', filePath);

//     try {
//       const doctorObj = new User(req.body);
//       console.log(doctorObj);
//       if (doctorObj.org == "Org1"){
//         app.readUploadsFromLedger(doctorObj, walletPath_org1);
//       }
//       else if (doctorObj.org == "Org2"){
//         app.readUploadsFromLedger(doctorObj, walletPath_org2);
//       }
//       else if (doctorObj.org == "Org3"){
//         app.readUploadsFromLedger(doctorObj, walletPath_org3);
//       }
//       console.log(`readUploadsFromLedger() -> Submitted transaction readUploadsFromLedger`);
//       res.status(200).json({ message: 'File uploaded successfully.', filePath: filePath });
//     } catch (error) {
//       console.error(`Failed to submit transaction readUploadsFromLedger: ${error}`);
//       res.status(500).json({ error: 'Failed to process uploaded file.' });
//     }
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     res.status(500).json({ error: 'Error uploading file.' });
//   }
// });



clientApp.get('/listPatientFiles', (req, res) => {
  const folderPath = '/usr/src/app/client/uploads/patient';

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Error reading folder:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const filesWithPatientId = files.map(file => {
      const match = file.match(/patient(\d+)-/i);
      const patientId = match ? match[1] : 'Unknown';
      return { filename: file, patientId: patientId };
    });

    res.json({ files: filesWithPatientId });
  });
});


/**
 * Route to invoke the method to read a specific patient's data based on patient's id.
 */
clientApp.post('/readPatientData', authenticateJWT, async (req, res) => {
  const patientObj = new User(req.body)
  const response = await app.readPatientData(patientObj);
  console.log("RESPONSE -------->>>> ", response);
  if (response.error) {

    res.send(response.error);
  } else {
    res.send(response);

  }
});

// clientApp.post('/emergencyAccessPatientRecord', authenticateJWT, async (req, res) => {
//   const doctorObj = new User(req.body)

//   const response = await app.emergencyAccessPatientRecord(doctorObj);
//   if (response.error) {

//     res.send(response.error);
//   } else {
//     res.send(response);

//   }
// });



clientApp.post('/readPersonalData', authenticateJWT, async (req, res) => {
  const patientObj = new User(req.body)
  const response = await app.readPersonalData(patientObj);
  console.log("RESPONSE -------->>>> ", response);
  if (response.error) {
    res.send(response.error);
  } else {
    res.send(response);

  }
});


/**
 * Route to invoke the method to read a all the data of all patients' from the ledger.
 */
clientApp.post('/readAllPatientData', authenticateJWT, async (req, res) => {
  const patientObj = new User(req.body)
  const response = await app.readAllPatientData(patientObj);
  if (response.error) {
    res.send(response.error);
  } else {
    res.send(response);
  }
});

// Route to invoke function to get history of a record
clientApp.post('/getRecordHistory', authenticateJWT, async (req, res) => {
  console.log('Beginning client API getRecordHistory')
  const patientObj = new User(req.body)
  const response = await app.getRecordHistory(patientObj);
  if (response.error) {
    res.send(response.error);
  } else {
    res.send(response);
  }
  console.log(response)
  console.log('Ending client API getRecordHistory')
});

/**
 * Method to grant access to the doctor by the patient to view his medical record
 */

/**
 * @swagger
 * /grantAccessDoctor:
 *   post:
 *     summary: Grant access to a doctor to view a patient's medical records.
 *     description: >
 *       Allows a patient to grant access to a doctor, enabling the doctor to view the patient's
 *       medical records. This action updates the access control list for the patient's records.
 *     tags: [Access Control]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - doctorId
 *             properties:
 *               patientId:
 *                 type: string
 *                 description: The unique identifier of the patient.
 *               doctorId:
 *                 type: string
 *                 description: The unique identifier of the doctor being granted access.
 *     responses:
 *       200:
 *         description: Access granted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A confirmation message stating access has been granted.
 *       400:
 *         description: Invalid request parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Authentication required or insufficient permissions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

clientApp.post('/grantAccessDoctor', authenticateJWT, async (req, res) => {
  const patientObj = new User(req.body)
  const response = await app.grantAccessDoctor(patientObj);
  if (response.error) {
    res.send(response.error);
  } else {
    res.send(response);
  }
});

clientApp.post('/getNotification', authenticateJWT, async (req, res) => {
  const doctorObj = new User(req.body)
  const response = await app.getNotification(doctorObj);
  if (response.error) {
    res.send(response.error);
  } else {
    res.send(response);
  }
});

clientApp.post('/updatePassword', authenticateJWT, async (req, res) => {
  const userObj = new User(req.body)
  let response = null;
  if (userObj.role === "doctor"){
    response = await app.updateDoctorPassword(userObj);
  } else if (userObj.role === "patient"){
    response = await app.updatePatientPassword(userObj);
  } else if (userObj.role === "researcher"){
    response = await app.updateResearcherPassword(userObj);
  }
  if (response.error) {
    res.send(response.error);
  } else {
    res.send(response);
  }
});

clientApp.post('/getPatientNotification', authenticateJWT, async (req, res) => {
  const patientObj = new User(req.body)
  const response = await app.getPatientNotification(patientObj);
  if (response.error) {
    res.send(response.error);
  } else {
    res.send(response);
  }
});

clientApp.post('/markNotificationsAsRead', authenticateJWT, async (req, res) => {
  const doctorObj = new User(req.body)
  const response = await app.markNotificationsAsRead(doctorObj);
  if (response.error) {
    res.send(response.error);
  } else {
    res.send(response);
  }
});

clientApp.post('/readStatisticsData', authenticateJWT, async (req, res) => {
  const researcherObj = new User(req.body)
  if (researcherObj.org === "Org1") {
    console.log(researcherObj)
    try {
      console.log("FOUND PATH: ", walletPath_org1)
      responseOrg1 = await app.readStatisticsData(researcherObj, walletPath_org1);
    } catch (error) {
      console.error(`Failed to read statistics data from Org1: ${error}`);
      responseOrg1 = { error: `Failed to read statistics data from Org1` };
    }
  }

  if (researcherObj.org === "Org2") {
    try {
      responseOrg2 = await app.readStatisticsData(researcherObj, walletPath_org2);
    } catch (error) {
      console.error(`Failed to read statistics data from Org2: ${error}`);
      responseOrg2 = { error: `Failed to read statistics data from Org2` };
    }
  }

  if (researcherObj.org === "Org3") {
    try {
      responseOrg3 = await app.readStatisticsData(researcherObj, walletPath_org3);
    } catch (error) {
      console.error(`Failed to read statistics data from Org3: ${error}`);
      responseOrg3 = { error: `Failed to read statistics data from Org3` };
    }
  }
});

clientApp.post('/readHomomorphicData', authenticateJWT, async (req, res) => {
  const researcherObj = new User(req.body)
  if (researcherObj.org === "Org1") {
    console.log(researcherObj)
    try {
      console.log("FOUND PATH: ", walletPath_org1)
      responseOrg1 = await app.readHomomorphicData(researcherObj, walletPath_org1);
    } catch (error) {
      console.error(`Failed to read homomorphic data from Org1: ${error}`);
      responseOrg1 = { error: `Failed to read homomorphic data from Org1` };
    }
  }

  if (researcherObj.org === "Org2") {
    try {
      responseOrg2 = await app.readHomomorphicData(researcherObj, walletPath_org2);
    } catch (error) {
      console.error(`Failed to read homomorphic data from Org2: ${error}`);
      responseOrg2 = { error: `Failed to read homomorphic data from Org2` };
    }
  }

  if (researcherObj.org === "Org3") {
    try {
      responseOrg3 = await app.readHomomorphicData(researcherObj, walletPath_org3);
    } catch (error) {
      console.error(`Failed to read homomorphic data from Org3: ${error}`);
      responseOrg3 = { error: `Failed to read homomorphic data from Org3` };
    }
  }
});

clientApp.post('/getDoctorsList', authenticateJWT, (req, res) => {
  const userObj = new User(req.body)
  if (userObj.role == "patient") {
    const query = 'SELECT * FROM doctors';
    pool.query(query, (error, results) => {
      if (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ message: 'Internal Server Error' });
      } else {
        res.json(results);
      }
    });
  }
  else {
    return res.status(403).json({ message: 'Forbidden' });
  }
});

clientApp.post('/getDoctorsList', authenticateJWT, (req, res) => {
  const userObj = new User(req.body)
  if (userObj.role == "patient") {
    const query = 'SELECT * FROM doctors';
    pool.query(query, (error, results) => {
      if (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ message: 'Internal Server Error' });
      } else {
        res.json(results);
      }
    });
  }
  else {
    return res.status(403).json({ message: 'Forbidden' });
  }
});

clientApp.post('/getDoctorsListByOrg', authenticateJWT, (req, res) => {
  const userObj = new User(req.body)
  if (userObj.role == "patient") {
    const query = 'SELECT * FROM doctors WHERE org = ?';
    pool.query(query, [userObj.org], (error, results) => {
      if (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ message: 'Internal Server Error' });
      } else {
        res.json(results);
      }
    });
  }
  else {
    return res.status(403).json({ message: 'Forbidden' });
  }
});

clientApp.post('/getPatientsList', authenticateJWT, (req, res) => {
  const userObj = new User(req.body)
  if (userObj.role == "doctor") {
    const query = 'SELECT * FROM patientsinfo';
    pool.query(query, (error, results) => {
      if (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Internal Server Error' });
      } else {
        res.json(results);
      }
    });
  }
  else {
    return res.status(403).json({ message: 'Forbidden' });
  }
});


clientApp.post('/getResearchersList', authenticateJWT, (req, res) => {
  const userObj = new User(req.body)
  if (userObj.role == "patient") {
    const query = 'SELECT * FROM researcher';

    pool.query(query, (error, results) => {
      if (error) {
        console.error('Error fetching researchers:', error);
        res.status(500).json({ message: 'Internal Server Error' });
      } else {
        res.json(results);
      }
    });
  }
  else {
    return res.status(403).json({ message: 'Forbidden' });
  }
});

clientApp.post('/getSpecificDoctorsList', authenticateJWT, async (req, res) => {
  const userObj = new User(req.body)
  if (userObj.role == "patient") {
    const response = await app.specificPatientData(userObj);
    if (response.error) {
      res.send(response.error);
    } else {
      res.send(response);
    }
  }
  else {
    return res.status(403).json({ message: 'Forbidden' });
  }
});

clientApp.post('/getSpecificResearchersList', authenticateJWT, async (req, res) => {
  const userObj = new User(req.body)
  if (userObj.role == "patient") {
    const response = await app.specificResearchersData(userObj);
    if (response.error) {
      res.send(response.error);
    } else {
      res.send(response);
    }
  } else {
    return res.status(403).json({ message: 'Forbidden' });
  }
});


/**
 * Method to grant access to the researcher by the patient to view his medical record
 */
// clientApp.post('/grantAccessResearcher', authenticateJWT, async (req, res) => {
// 	const patientObj = new User(req.body)
// 	const response = await app.grantAccessResearcher(patientObj);
// 	if (response.error) {
//     res.send(response.error);
//   } else {
//     res.send(response);
//   }
// });

/**
 * Method to revoke access to the doctor by the patient.
 */

/**
 * @swagger
 * /revokeAccessDoctor:
 *   post:
 *     summary: Revoke a doctor's access to a patient's medical records.
 *     description: >
 *       Allows a patient to revoke previously granted access to a doctor, preventing the doctor
 *       from viewing the patient's medical records. This action updates the access control list
 *       for the patient's records.
 *     tags: [Access Control]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - doctorId
 *             properties:
 *               patientId:
 *                 type: string
 *                 description: The unique identifier of the patient.
 *               doctorId:
 *                 type: string
 *                 description: The unique identifier of the doctor whose access is being revoked.
 *     responses:
 *       200:
 *         description: Access revoked successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A confirmation message stating access has been revoked.
 *       400:
 *         description: Invalid request parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Authentication required or insufficient permissions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */


clientApp.post('/revokeAccessDoctor', authenticateJWT, async (req, res) => {
  const patientObj = new User(req.body)
  const response = await app.revokeAccessDoctor(patientObj);
  
  if (response.error) {
    res.send(response.error);
  } else {
    res.send(response);
  }
});


clientApp.post('/revokeAccessResearcher', authenticateJWT, async (req, res) => {
  const patientObj = new User(req.body)
  const response = await app.revokeAccessResearcher(patientObj);
  if (response.error) {
    res.send(response.error);
  } else {
    res.send(response);
  }
});



clientApp.post('/emergencyAccessPatientRecord', authenticateJWT, async (req, res) => {
  try {

      let verificationKey;
      try {
        verificationKey = JSON.parse(fs.readFileSync('EmergencyAccess_verification_key.json', 'utf8'));
        console.log('Verification key loaded successfully.');
      } catch (err) {
        console.error('Error loading verification key:', err);
        process.exit(1);
      }

      const doctorObj = new User(req.body);
      console.log(doctorObj);

      if (!doctorObj.proof || !doctorObj.publicSignals) {
        return res.status(400).json({ error: 'Proof and publicSignals are required.' });
      }

      const valid = await snarkjs.groth16.verify(verificationKey, doctorObj.publicSignals, doctorObj.proof);
      if (!valid) {
        console.log('Proof verification failed for patient:', doctorObj.patientId);
        return res.status(400).json({ error: 'Invalid emergency proof provided.' });
      }
      const result = app.emergencyAccessPatientRecord(doctorObj);
      console.log('Proof verified successfully for patient:', doctorObj.patientId);
      res.json(result);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

clientApp.post('/emergencyAccessPatientRecordHash', authenticateJWT, async (req, res) => {
  try {
    const secretKey = 12344321;
      const doctorObj = new User(req.body);
      console.log(doctorObj);

      const secretBigInt = BigInt(secretKey);
      const output = poseidon1([secretBigInt]);
      console.log(output.toString());
      res.json(output.toString());

  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

/* 
***************************************************************
***************************************************************
***************************************************************

Trying to implement zk-Rollups for emergency access

***************************************************************
***************************************************************
***************************************************************
*/

