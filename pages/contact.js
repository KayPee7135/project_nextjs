export default function Contact() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-4 text-black">Contact Us</h1>
      <p className="mb-6 text-black">Have questions or feedback? Fill out the form below or email us at <a href="mailto:support@internmate.com" className="text-blue-600 underline">support@internmate.com</a>.</p>
      <form className="space-y-4">
        <input type="text" placeholder="Your Name" className="w-full px-4 py-2 border rounded text-black" required />
        <input type="email" placeholder="Your Email" className="w-full px-4 py-2 border rounded text-black" required />
        <textarea placeholder="Your Message" className="w-full px-4 py-2 border rounded text-black" rows={5} required></textarea>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Send Message</button>
      </form>
    </div>
  );
} 