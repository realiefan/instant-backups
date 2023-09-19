import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function PaymentStatusCheck() {
  const [publicKey, setPublicKey] = useState("");
  const [creationResponse, setCreationResponse] = useState(null);
  const [qrImageSrc, setQrImageSrc] = useState("");
  const [qrLinkHref, setQrLinkHref] = useState("");
  const [invoiceData, setInvoiceData] = useState("");
  const [resultText, setResultText] = useState("");
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);

  useEffect(() => {
    // This useEffect runs once when the component mounts
    // You can add any initialization logic here if needed
  }, []);

  const checkPaymentStatus = async () => {
    const apiUrl = `https://new.nostryfied.online/jobs?pk=${publicKey}`;

    try {
      const response = await axios.put(apiUrl);

      if (response.status === 200) {
        const responseData = response.data;
        console.log("Job Creation Response:", responseData);

        setCreationResponse(responseData);

        // Set the src attribute of the QR code image
        setQrImageSrc(responseData.qr);

        // Set the href attribute of the anchor tag to the lightning URI with the invoice
        setQrLinkHref(`lightning:${encodeURIComponent(responseData.invoice)}`);

        // Populate the invoice div with the invoice data
        setInvoiceData(responseData.invoice);

        const jobId = responseData.id;

        let paymentStatus = await getPaymentStatus(jobId);

        while (!paymentStatus.done) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          paymentStatus = await getPaymentStatus(jobId);
        }

        if (paymentStatus.paid) {
          setPaymentSuccessful(true);
          setResultText("Payment successful. You can now download the backup.");
        } else {
          setPaymentSuccessful(false);
          setResultText("Payment not successful.");
        }

        // Set the src attribute of the QR code image
        setQrImageSrc(responseData.qr);

        // Populate the invoice div with the invoice data

        const confirmationData = await confirmPaymentAndGetJobData(jobId);
        console.log("Confirmation and Data Response:", confirmationData);
      } else {
        setResultText("An error occurred while processing the request.");
      }
    } catch (error) {
      console.error("An error occurred:", error);
      setResultText("An error occurred while processing the request.");
    }
  };

  const getPaymentStatus = async (jobId) => {
    const apiUrl = `https://new.nostryfied.online/jobs/${jobId}/check`;

    try {
      const response = await axios.post(apiUrl);

      if (response.status === 200) {
        const paymentStatus = response.data;
        console.log("Payment Status Response:", paymentStatus);
        return paymentStatus;
      } else {
        console.error(
          "An error occurred while checking payment status:",
          response.statusText
        );
        return { paid: false, done: false };
      }
    } catch (error) {
      console.error("An error occurred while checking payment status:", error);
      return { paid: false, done: false };
    }
  };

  const confirmPaymentAndGetJobData = async (jobId) => {
    const apiUrl = `https://new.nostryfied.online/jobs/${jobId}/confirm`;

  
  };

  const downloadBackup = async (jobId) => {
    try {
      const response = await axios.get(
        `https://new.nostryfied.online/jobs/${jobId}/download`
      );

      if (response.status === 200) {
        const backupData = response.data;

        // Create a JSON blob with the backup data
        const jsonBlob = new Blob([JSON.stringify(backupData)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(jsonBlob);

        // Create a link element and trigger the download
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "backup.json");
        document.body.appendChild(link);
        link.click();
        setResultText("Backup download initiated.");
      } else {
        setResultText("Failed to initiate backup download.");
      }
    } catch (error) {
      console.error("An error occurred while downloading backup:", error);
      setResultText("An error occurred while downloading backup.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-semibold">Check Payment Status</h1>
      <p className="mt-2">
        Hey there! To check your payment status, please enter your public key
        below:
      </p>
      <input
        type="text"
        value={publicKey}
        onChange={(e) => setPublicKey(e.target.value)}
        placeholder="Your Public Key"
        className="mt-2 p-2 bg-gray-800 rounded text-white w-full"
      />
      <button
        onClick={checkPaymentStatus}
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
      >
        Submit
      </button>
      <div id="result" className="mt-4">
        {resultText}
      </div>
      <div id="creationResponse" className="mt-4">
       
        <pre className="bg-gray-800 p-2 hidden rounded">
          {JSON.stringify(creationResponse, null, 2)}
        </pre>
      </div>
      <a id="qrLink" href={qrLinkHref} className="mt-4 block">
        <img id="qrImage" src={qrImageSrc} alt="QR Code" />
      </a>
      <div id="invoice" className="mt-4">
        <p>Invoice:</p>
        {invoiceData}
      </div>
      {paymentSuccessful && (
        <button
          onClick={() => downloadBackup(creationResponse.id)}
          className="mt-4 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
        >
          Download Backup
        </button>
      )}
    </div>
  );
}

export default PaymentStatusCheck;