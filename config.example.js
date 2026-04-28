/**
 * CALNT Website — Credentials Template
 *
 * 1. Copy this file to config.js
 *    cp config.example.js config.js
 *
 * 2. Fill in your real keys (see SETUP.md for how to get them)
 *
 * 3. NEVER commit config.js to git — it is in .gitignore
 */

const CALNT_CONFIG = {

  emailjs: {
    /**
     * Get these from https://dashboard.emailjs.com
     * Public Key  → Account → API Keys
     * Service ID  → Email Services → your service
     * Template ID → Email Templates → your template
     */
    publicKey:  'YOUR_EMAILJS_PUBLIC_KEY',
    serviceId:  'YOUR_EMAILJS_SERVICE_ID',
    templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
  },

  googleSheets: {
    /**
     * Deploy your Apps Script as a Web App and paste the URL here.
     * See google-apps-script.js for the script code to deploy.
     */
    scriptUrl: 'YOUR_GOOGLE_APPS_SCRIPT_URL',
  }

};
