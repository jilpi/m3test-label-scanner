// # Global Variables
// ## Latest QR Scanner readings
var latestResult = "";
var latestResultTime = new Date().getTime();
var latestBookingData;
// API
var authorizationToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjozLCJlbWFpbCI6ImotbC5waWNhcmRAbS0zLmNvbSIsInVzZXJuYW1lIjpudWxsLCJmaXJzdG5hbWUiOm51bGwsImxhc3RuYW1lIjpudWxsLCJjb3VudHJ5X2NvZGUiOm51bGwsIm1vYmlsZSI6bnVsbCwiYmlydGhkYXRlIjpudWxsLCJnZW5kZXIiOm51bGwsImNvbmZpcm1lZCI6dHJ1ZSwicm9sZSI6eyJsYWJlbCI6IkFkbWluIn19LCJpYXQiOjE2MDUyMDc0NzMsImV4cCI6MTYwNTI5Mzg3M30.AQ-bl_q-a46bnBgdaF-Ip51y5KqcdY0lQGF1u1Dgc78";

// # Constants declarations
// ## Key HTML Elements
const video = document.getElementById('qr-video');
const camHasCamera = document.getElementById('cam-has-camera');
const camQrResult = document.getElementById('cam-qr-result');
const camQrResultTimestamp = document.getElementById('cam-qr-result-timestamp');
const autoprintToggle = document.getElementById('autoprint-toggle');
const loginStatus = document.getElementById('loginstatus');
const loginbtn = document.getElementById('loginbtn');
const printbtn = document.getElementById('printbtn');

const lbllastname = document.getElementById('lastname');
const lblfirstname = document.getElementById('firstname');
const lblgender = document.getElementById('gender');
const lblavs = document.getElementById('avs');
const lblinsurance = document.getElementById('insurance');
const lblmobile = document.getElementById('mobile');
const lblemail = document.getElementById('email');
const lblsite_name = document.getElementById('site_name');
const lbldob = document.getElementById('dob');

const labelIframe = document.getElementById('label');

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
    console.info("- Retrieving data for booking ID" + camQrResult.value)
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
    // API request
    var strEndPoint = REST_API_URL + API_LABEL_INFO_PATH + id;
    var data = {};

    console.info(`- API Call for ${id}`);
    console.info(`  - API call at: ${strEndPoint}`);
    console.info(`    headers: `, REST_API_REQUEST_HEADERS);
    try {
        var response = await axios.get(strEndPoint, { headers: REST_API_REQUEST_HEADERS })
        console.log('  - Raw data:', response);
        // Getting a data object from response that contains the necessary data from the server
        data["code"] = response.data.code;
        data["site_name"] = response.data.site_name;
        data["service_type"] = "COV19-RAPID";
        data["firstname"] = response.data.patient_firstname;
        data["lastname"] = response.data.patient_lastname;
        var birthdate = new Date(Date.parse(response.data.patient_birthdate));
        data["dob"] = niceDate(birthdate);
        data["gender"] = response.data.patient_gender;
        data["avs"] = response.data.patient_avs;
        data["insurance"] = response.data.patient_InsurerNumber;
        data["mobile"] = response.data.patient_phone;
        data["email"] = response.data.user_email;
        data["bookingdate"] = response.data.date;    
    }
    catch(err){
        console.error('API Call error', err)
    }
    
    console.log('  - Returned booking data:', data);

    return data;
}

printbtn.onclick = printframe;

function printframe(){
    labelIframe.focus();
    labelIframe.contentWindow.print();
}

async function printLabel(bookingData = latestBookingData){

    if (autoprintToggle.checked){
        bookingData.autoprint="";
        console.info('  - Autoprint enabled')
    }

    console.info(`- Generate label ${bookingData.code}`);
    const baseUrl = document.URL.substr(0,document.URL.lastIndexOf('/'));
    const labelUrl = new URL(baseUrl + '/generator/label-generator.html');
    labelUrl.search = new URLSearchParams(bookingData);
    console.info(`  - Label URL: ${labelUrl.toString()}`);
    labelIframe.src = labelUrl;
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

        latestBookingData = await getBookingDataFromAPI(result);
        printLabel(latestBookingData);

        lbllastname.innerHTML = latestBookingData.lastname;
        lblfirstname.innerHTML = latestBookingData.firstname;
        lblgender.innerHTML = latestBookingData.gender;
        
        lblavs.innerHTML = latestBookingData.avs;
        lblinsurance.innerHTML = latestBookingData.insurance;
        lblmobile.innerHTML = latestBookingData.mobile;
        lblemail.innerHTML = latestBookingData.email;
        // lblsite_name.innerHTML = latestBookingData.site_name;
        lbldob.innerHTML = latestBookingData.dob;

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


