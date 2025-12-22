/**
 * Support Page for App Store Compliance
 * Static page with app info, contact details, and FAQ
 */

function SupportPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Bagel Crust Employee App - Support
        </h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">App Information</h2>
          <p className="text-gray-600"><strong>App Name:</strong> Bagel Crust Employee Portal</p>
          <p className="text-gray-600"><strong>Developer:</strong> Bagel Crust</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Contact</h2>
          <p className="text-gray-600">
            <a href="mailto:bryan@bagelcrust.biz" className="text-blue-600 hover:underline">
              bryan@bagelcrust.biz
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Description</h2>
          <p className="text-gray-600">
            The Bagel Crust Employee Portal allows staff to access their schedules,
            clock in/out, and manage time-off requests.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">FAQ</h2>

          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-800">Q: How do I log in?</p>
              <p className="text-gray-600">A: Enter your 4-digit employee PIN on the login screen.</p>
            </div>

            <div>
              <p className="font-medium text-gray-800">Q: I forgot my PIN. What do I do?</p>
              <p className="text-gray-600">A: Contact your manager to reset your PIN.</p>
            </div>

            <div>
              <p className="font-medium text-gray-800">Q: The app isn't working. Who do I contact?</p>
              <p className="text-gray-600">
                A: Email{' '}
                <a href="mailto:bryan@bagelcrust.biz" className="text-blue-600 hover:underline">
                  bryan@bagelcrust.biz
                </a>
                {' '}for technical support.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SupportPage;
