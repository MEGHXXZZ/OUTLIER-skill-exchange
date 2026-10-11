// Simple API test script
// Run this with: node test-api.js

const API_URL = "http://localhost:5000/api";

async function testBackend() {
  console.log("🔍 Testing OUTLIER Backend...\n");

  try {
    // Test 1: Check if server is alive
    const healthCheck = await fetch(`${API_URL}/health`);
    console.log("✅ Server is alive:", healthCheck.status);

    // Test 2: Get all users
    const users = await fetch(`${API_URL}/users`);
    const userData = await users.json();
    console.log(`✅ Found ${userData.length} users in database`);

    // Test 3: Get all skills
    const skills = await fetch(`${API_URL}/skills`);
    const skillData = await skills.json();
    console.log(`✅ Found ${skillData.length} skills in database`);

    console.log("\n🎉 Backend is working!");
  } catch (error) {
    console.log("❌ ERROR:", error.message);
    console.log("\nPossible issues:");
    console.log("1. Backend is not running (Run 'node server.js' in backend folder)");
    console.log("2. Wrong port (Check if server is on 5000)");
    console.log("3. CORS not enabled");
  }
}

testBackend();