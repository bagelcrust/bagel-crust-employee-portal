/**
 * Privacy Policy Page for App Store Compliance
 */

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Privacy Policy - Bagel Crust Employee Portal
        </h1>
        <p className="text-gray-500 mb-8">Last updated: December 22, 2025</p>

        <p className="text-gray-600 mb-8">
          The Bagel Crust Employee Portal app is for internal use by Bagel Crust employees only.
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Data We Collect</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Employee PIN (for authentication)</li>
            <li>Clock in/out times</li>
            <li>Schedule information</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">How We Use Data</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>To verify employee identity</li>
            <li>To track work hours</li>
            <li>To display work schedules</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Data Storage</h2>
          <p className="text-gray-600">
            All data is stored securely on our servers and is only accessible to authorized personnel.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Data Sharing</h2>
          <p className="text-gray-600">
            We do not sell or share employee data with third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Contact</h2>
          <p className="text-gray-600">
            For questions about this policy, contact{' '}
            <a href="mailto:bryan@bagelcrust.com" className="text-blue-600 hover:underline">
              bryan@bagelcrust.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPage;
