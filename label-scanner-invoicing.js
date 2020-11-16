// # Global Variables
// ## Latest QR Scanner readings
var latestResult = "";
var latestResultTime = new Date().getTime();
var latestInvoicingData;
// API
var authorizationToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjozLCJlbWFpbCI6ImotbC5waWNhcmRAbS0zLmNvbSIsInVzZXJuYW1lIjpudWxsLCJmaXJzdG5hbWUiOm51bGwsImxhc3RuYW1lIjpudWxsLCJjb3VudHJ5X2NvZGUiOm51bGwsIm1vYmlsZSI6bnVsbCwiYmlydGhkYXRlIjpudWxsLCJnZW5kZXIiOm51bGwsImNvbmZpcm1lZCI6dHJ1ZSwicm9sZSI6eyJsYWJlbCI6IkFkbWluIn19LCJpYXQiOjE2MDU1MDAzODgsImV4cCI6MTYwNTU4Njc4OH0.ujzEat6noeZ2ks43TzGpw5VVdPOWu6b9ZgM3mu2h3W8";

// # Constants declarations
// ## Key HTML Elements
const video = document.getElementById('qr-video');
const camHasCamera = document.getElementById('cam-has-camera');
const camQrResult = document.getElementById('cam-qr-result');
const camQrResultTimestamp = document.getElementById('cam-qr-result-timestamp');
const loginStatus = document.getElementById('loginstatus');
const loginbtn = document.getElementById('loginbtn');

const lbllastname = document.getElementById('lastname');
const lblfirstname = document.getElementById('firstname');
const lblgender = document.getElementById('gender');
const lblavs = document.getElementById('avs');
const lblinsurance = document.getElementById('insurance');
const lblmobile = document.getElementById('mobile');
const lblemail = document.getElementById('email');
const lblsite_name = document.getElementById('site_name');
const lbldob = document.getElementById('dob');

const lbladresse = document.getElementById('address');
const lblsymptoms = document.getElementById('symptoms');


// ## API
const REST_API_URL="https://m3-test.ch/api/";
const API_LABEL_INFO_PATH = "test/info?code=";
const API_ENDPOINT_LOGIN = 'auth/login';
var REST_API_REQUEST_HEADERS;
setAuthHeaders();

// ## Others
const REPRINT_INTERVAL = 5000;

// # Main program 
// ## Check camera
QrScanner.hasCamera().then(
    function(hasCamera) {
        console.info(`  - Camera${hasCamera?"":" not"} found`);
        camHasCamera.textContent = hasCamera ? "✅" : "❌"
    }
);

// ## QR Scanner
console.info("QR SCANNER - STARTS");

// Import library
import QrScanner from "./qr-scanner/qr-scanner.min.js";
QrScanner.WORKER_PATH = './qr-scanner/qr-scanner-worker.min.js';

// Instantiate Scanner
console.info("- Instantiate scanner");
const scanner = new QrScanner(video, result => checkQrCode(result), error => {
    // camQrResult.textContent = error;
    // camQrResult.style.color = 'inherit';
});

// for debugging
window.scanner = scanner;

// ## Setup html elements
console.info("- Display scan area");
document.getElementsByTagName("scan-preview")[0].appendChild(scanner.$canvas);
scanner.$canvas.height="50";
scanner.$canvas.style.display = 'block';

// ## Start Scanner
console.info("- Start scanner");
startScanner();

// # Setup buttons
// ## Check Code Manually
document.getElementById("btn-check-qrcode").onclick = function(){
    console.info("- Retrieving data for booking ID" + camQrResult.value);
    checkQrCode(camQrResult.value);
}

loginbtn.onclick = loginprocess;

async function loginprocess(){
    var email = prompt("Your email?");
    var password = prompt("Your password?");

    await axios.post(REST_API_URL + API_ENDPOINT_LOGIN, 
        {
            'email': email,
            'password': password
        } )
        // Handle a successful response from the server
        .then(
            function (response) {
                authorizationToken = response.data.token;
                setAuthHeaders();
                loginStatus.innerHTML = `Login status: ✅`
                console.log(response);
                console.log(authorizationToken);
            }
        )
        // Catch and print errors if any
        .catch(function(error){
                console.error('API Call', error)
            }
        );
}

function niceDate(date){
    return date.getDate() + "-" + (date.getMonth()+1) + "-" + date.getFullYear()
}

async function getBookingDataFromAPI(id){
    var strEndPoint = REST_API_URL + API_LABEL_INFO_PATH + id;
    var data = {};

    console.info(`- API Call for ${id}`);
    console.info(`  - API call at: ${strEndPoint}`);
    console.info(`    headers: `, REST_API_REQUEST_HEADERS);
 
 
    try {
        var response = await axios.get(strEndPoint, { headers: REST_API_REQUEST_HEADERS })
        console.log('  - Raw data:', response);
        // Getting a data object from response that contains the necessary data from the server
        var birthdate = new Date(Date.parse(response.data.patient_birthdate));
        data = {
            "code": response.data.code,
            "site_name": response.data.site_name,
            "service_type": "COV19-RAPID",
            "firstname": response.data.patient_firstname,
            "lastname": response.data.patient_lastname,
            "dob": niceDate(birthdate),
            "gender": response.data.patient_gender,
            "avs": response.data.patient_avs,
            "insurance": response.data.patient_InsurerNumber,
            "mobile": response.data.patient_phone,
            "email": response.data.user_email,
            "bookingdate": response.data.date,
            "address1": response.data.patient_address_line_1,
            "address2": response.data.patient_address_line_2,
            "postcode": response.data.patient_postal_code,
            "city": response.data.patient_city
        }
    }
    catch(err){
        console.error('API Call error', err)
    }

    console.log('  - Returned invoicing data:', data);

    return data;
}

function startScanner() {
    var result = scanner.start();
    if (result)
        console.info("  - Scanner started successfully");
    else
        console.error("  - Scanner failed to start !!");
}

async function checkQrCode(result) {
    // Get new label?
    // Yes if:
    //    - the scanned code is NEW
    //    - the scanned code is the same as last time, but wasn't scanned for > REPRINT_INTERVAL milliseconds

    if ((latestResult != result)
            || (latestResult = result) && (Date.now() - latestResultTime > REPRINT_INTERVAL)) {

        latestInvoicingData = await getBookingDataFromAPI(result);

        lbllastname.textContent = latestInvoicingData.lastname;
        lblfirstname.textContent = latestInvoicingData.firstname;
        lblgender.textContent = latestInvoicingData.gender;
        
        lblavs.textContent = latestInvoicingData.avs;
        lblinsurance.textContent = latestInvoicingData.insurance;
        lblmobile.textContent = latestInvoicingData.mobile;
        lblemail.textContent = latestInvoicingData.email;
        // lblsite_name.textContent = latestInvoicingData.site_name;
        lbldob.textContent = latestInvoicingData.dob;
        
        lbladresse.textContent = `${latestInvoicingData.address1} *
        ${latestInvoicingData.address2} *
        ${latestInvoicingData.postcode} *
        ${latestInvoicingData.city}`

        window.lbllastname=lbllastname;
    }

    // Update latest result
    camQrResult.value = result;
    latestResult = result;
    
    // Update latest result time
    latestResultTime = Date.now();
    var time = new Date().toJSON().slice(11,23);
    camQrResultTimestamp.textContent = time;

    // Change result color for REPRINT_INTERVAL milliseconds to indicate timeout
    camQrResultTimestamp.style.color = 'red';
    clearTimeout(camQrResultTimestamp.highlightTimeout);
    camQrResultTimestamp.highlightTimeout = setTimeout(() => camQrResultTimestamp.style.color = 'inherit', 5000);

}



function setAuthHeaders(){
    REST_API_REQUEST_HEADERS = {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + authorizationToken
    }
}

// # Tools
// renameKey in an object
function renameKey(o, old_key, new_key){
    if (old_key !== new_key) {
        Object.defineProperty(o, new_key,
           Object.getOwnPropertyDescriptor(o, old_key));
        delete o[old_key];
    }
}
