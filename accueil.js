// # Global Variables
// ## Latest QR Scanner readings
var latestResult = "";
var latestResultTime = new Date().getTime();
var latestBookingData;
var latestInvoicingData;
// API
var authorizationToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjo4MTk3LCJlbWFpbCI6ImFjY3VlaWxAbTMtdGVzdC5jaCIsInVzZXJuYW1lIjpudWxsLCJmaXJzdG5hbWUiOm51bGwsImxhc3RuYW1lIjpudWxsLCJjb3VudHJ5X2NvZGUiOiIrMzMiLCJtb2JpbGUiOiIwNjg5MDg5NjczIiwiYmlydGhkYXRlIjpudWxsLCJnZW5kZXIiOm51bGwsImNvbmZpcm1lZCI6dHJ1ZSwicm9sZSI6eyJsYWJlbCI6IlN0YW5kYXJkIn19LCJpYXQiOjE2MDg1NTExNDEsImV4cCI6MTYwODYzNzU0MX0.0Z0krsXsDd_5BQofJ95cAxRe5xf1P5u1bIbnP10KsbI";

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

const lbladresse = document.getElementById('address');
const lblsymptoms = document.getElementById('symptoms');

const lblreason = document.getElementById('reason');
const lbltype = document.getElementById('type');

const labelIframe = document.getElementById('label');

// ## API
const REST_API_URL="https://m3-test.ch/api/";
const API_LABEL_INFO_PATH = "test/info?code=";
const API_ENDPOINT_LOGIN = 'auth/login/standard';
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
try{
    document.getElementById("btn-check-qrcode").onclick = function(){
        console.info("- Retrieving data for booking ID" + camQrResult.value);
        checkQrCode(camQrResult.value);
    }
}
catch{}

try{
    document.getElementById("btn-check-qrcode-invoicing").onclick = function(){
        console.info("- Retrieving data for booking ID" + camQrResult.value);
        checkQrCode_invoicing(camQrResult.value);
    }
}
catch{}

loginbtn.onclick = loginprocess;
printbtn.onclick = printframe;

function printframe(){
    labelIframe.focus();
    labelIframe.contentWindow.print();
}


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

// async function getInvoicingDataFromAPI(id){
//     var strEndPoint = REST_API_URL + API_LABEL_INFO_PATH + id;
//     var data = {};

//     console.info(`- API Call for ${id}`);
//     console.info(`  - API call at: ${strEndPoint}`);
//     console.info(`    headers: `, REST_API_REQUEST_HEADERS);
 
 
//     try {
//         var response = await axios.get(strEndPoint, { headers: REST_API_REQUEST_HEADERS })
//         console.log('  - Raw data:', response);
//         // Getting a data object from response that contains the necessary data from the server
//         var birthdate = new Date(Date.parse(response.data.patient_birthdate));
//         data = {
//             "code": response.data.code,
//             "site_name": response.data.site_name,
//             "service_type": `COV19-${response.data.type.toUpperCase()}`,
//             "firstname": response.data.patient_firstname,
//             "lastname": response.data.patient_lastname,
//             "dob": niceDate(birthdate),
//             "gender": response.data.patient_gender,
//             "avs": response.data.patient_avs,
//             "insurance": response.data.patient_InsurerNumber,
//             "mobile": response.data.patient_phone,
//             "email": response.data.user_email,
//             "bookingdate": response.data.date,
//             "address1": response.data.patient_address_line_1,
//             "address2": response.data.patient_address_line_2,
//             "postcode": response.data.patient_postal_code,
//             "city": response.data.patient_city,
//             "country": response.data.patient_country,
//             "insurer_name": response.data.patient_insurer_name,
//             "type": response.data.type,
//             "reason": response.data.reason
//         }
//     }
//     catch(err){
//         console.error('API Call error', err)
//     }

//     console.log('  - Returned invoicing data:', data);

//     return data;
// }

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
        data["service_type"] = `COV19-${response.data.type.toUpperCase()}`;
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
        data["type"] = response.data.type;
        data["reason"] = response.data.reason;
    }
    catch(err){
        console.error('API Call error', err)
    }
    
    console.log('  - Returned booking data:', data);

    return data;
}

async function printLabel(bookingData = latestBookingData){
    if (autoprintToggle && autoprintToggle.checked){
        bookingData.autoprint="";
        console.info('  - Autoprint enabled')
    }

    console.info(`- Generate label ${bookingData.code}`);
    const baseUrl = document.URL.substr(0,document.URL.lastIndexOf('/'));
    const labelUrl = new URL(baseUrl + '/generator/label-generator.html');
    labelUrl.search = new URLSearchParams(bookingData);
    console.info(`  - Label URL: ${labelUrl.toString()}`);
    if (labelIframe) {
        labelIframe.src = labelUrl;
    }
}

function startScanner() {
    var result = scanner.start();
    if (result)
        console.info("  - Scanner started successfully");
    else
        console.error("  - Scanner failed to start !!");
}

async function checkQrCode_invoicing(result) {
    // Get new label?
    // Yes if:
    //    - the scanned code is NEW
    //    - the scanned code is the same as last time, but wasn't scanned for > REPRINT_INTERVAL milliseconds

    if ((latestResult != result)
            || (latestResult = result) && (Date.now() - latestResultTime > REPRINT_INTERVAL)) {

        latestInvoicingData = await getBookingDataFromAPI(result);
        printLabel(latestInvoicingData);

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
        ${latestInvoicingData.city} *
        ${latestInvoicingData.country}`;

        lbltype.textContent = latestInvoicingData.type;
        lblreason.textContent = latestInvoicingData.reason;
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

        lbltype.textContent = latestBookingData.type;
        lblreason.textContent = latestBookingData.reason;
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
