// Test the parsing function directly
const parseProjectMessage = (message) => {
  const lines = message.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  
  let name = ''
  let description = ''
  let url = ''
  let team_name = ''
  let team_members = ''
  let currentField = ''
  
  console.log('📝 Input message:', message);
  console.log('📝 Split lines:', lines);
  
  // More flexible field detection
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    const originalLine = lines[i]
    
    console.log(`\n🔍 Processing line ${i + 1}: "${originalLine}"`);
    console.log(`   Lowercase: "${line}"`);
    
    // Check for field headers (case insensitive, more flexible)
    if (line.includes('project name:') || line.includes('name:') || line.includes('project:')) {
      currentField = 'name'
      name = originalLine.substring(originalLine.indexOf(':') + 1).trim()
      console.log(`   ✅ Found name field: "${name}"`);
    } else if (line.includes('description:') || line.includes('desc:')) {
      currentField = 'description'
      description = originalLine.substring(originalLine.indexOf(':') + 1).trim()
      console.log(`   ✅ Found description field: "${description}"`);
    } else if (line.includes('url:') || line.includes('link:') || line.includes('github:') || line.includes('demo:')) {
      currentField = 'url'
      url = originalLine.substring(originalLine.indexOf(':') + 1).trim()
      console.log(`   ✅ Found URL field: "${url}"`);
    } else if (line.includes('team name:') || line.includes('team:') || line.includes('group:')) {
      currentField = 'team_name'
      team_name = originalLine.substring(originalLine.indexOf(':') + 1).trim()
      console.log(`   ✅ Found team_name field: "${team_name}"`);
    } else if (line.includes('team members:') || line.includes('members:') || line.includes('team members') || line.includes('developers:')) {
      currentField = 'team_members'
      team_members = originalLine.substring(originalLine.indexOf(':') + 1).trim()
      console.log(`   ✅ Found team_members field: "${team_members}"`);
    } else {
      console.log(`   ⚠️  No field header found, currentField: "${currentField}"`);
      // Continue reading content for the current field
      if (currentField === 'name' && !name) {
        name = originalLine
        console.log(`   📝 Set name from content: "${name}"`);
      } else if (currentField === 'description') {
        if (description) {
          description += ' ' + originalLine
        } else {
          description = originalLine
        }
        console.log(`   📝 Set description from content: "${description}"`);
      } else if (currentField === 'url' && !url) {
        url = originalLine
        console.log(`   📝 Set URL from content: "${url}"`);
      } else if (currentField === 'team_name' && !team_name) {
        team_name = originalLine
        console.log(`   📝 Set team_name from content: "${team_name}"`);
      } else if (currentField === 'team_members') {
        if (team_members) {
          team_members += ', ' + originalLine
        } else {
          team_members = originalLine
        }
        console.log(`   📝 Set team_members from content: "${team_members}"`);
      }
    }
  }
  
  // Clean up fields
  name = name.trim()
  description = description.trim()
  url = url.trim()
  team_name = team_name.trim()
  team_members = team_members.trim()
  
  console.log('\n📊 Final parsed fields:');
  console.log(`   name: "${name}"`);
  console.log(`   description: "${description}"`);
  console.log(`   url: "${url}"`);
  console.log(`   team_name: "${team_name}"`);
  console.log(`   team_members: "${team_members}"`);
  
  // More flexible validation - try to extract missing fields from context
  if (!name && lines.length > 0) {
    // Try to use first line as name if no explicit name field
    name = lines[0]
    console.log(`   🔧 Auto-extracted name: "${name}"`);
  }
  
  if (!description && lines.length > 1) {
    // Try to use second line as description if no explicit description field
    description = lines[1]
    console.log(`   🔧 Auto-extracted description: "${description}"`);
  }
  
  // Look for URLs in any line (more comprehensive)
  if (!url) {
    for (const line of lines) {
      // Check if the line contains a URL
      const urlMatch = line.match(/(https?:\/\/[^\s]+)/i)
      if (urlMatch) {
        url = urlMatch[1]
        console.log(`   🔧 Auto-extracted URL: "${url}"`);
        break
      }
      // Also check if the entire line is a URL
      if (isValidUrl(line)) {
        url = line
        console.log(`   🔧 Auto-extracted URL (full line): "${url}"`);
        break
      }
    }
  }
  
  // Look for team info in any line (more comprehensive)
  if (!team_name) {
    for (const line of lines) {
      const lowerLine = line.toLowerCase()
      if (lowerLine.includes('we are') || lowerLine.includes('team') || lowerLine.includes('group')) {
        // Extract team name from phrases like "We are Team Awesome" or "Team: Awesome"
        if (lowerLine.includes('we are')) {
          team_name = line.replace(/we are\s*/i, '').trim()
        } else if (lowerLine.includes('team:')) {
          team_name = line.substring(line.indexOf('team:') + 5).trim()
        } else if (lowerLine.includes('group:')) {
          team_name = line.substring(line.indexOf('group:') + 6).trim()
        } else if (lowerLine.startsWith('team ')) {
          team_name = line.substring(5).trim()
        }
        if (team_name) {
          console.log(`   🔧 Auto-extracted team_name: "${team_name}"`);
          break
        }
      }
    }
  }
  
  if (!team_members) {
    for (const line of lines) {
      const lowerLine = line.toLowerCase()
      if (lowerLine.includes('members:') || lowerLine.includes('developers:') || lowerLine.includes('team members')) {
        team_members = line.substring(line.indexOf(':') + 1).trim()
        console.log(`   🔧 Auto-extracted team_members: "${team_members}"`);
        break
      }
    }
  }
  
  console.log('\n📊 Final fields after auto-extraction:');
  console.log(`   name: "${name}"`);
  console.log(`   description: "${description}"`);
  console.log(`   url: "${url}"`);
  console.log(`   team_name: "${team_name}"`);
  console.log(`   team_members: "${team_members}"`);
  
  // Final validation
  const isValid = name && description && url && team_name && team_members && isValidUrl(url);
  console.log(`\n✅ Validation result: ${isValid ? 'PASS' : 'FAIL'}`);
  
  if (isValid) {
    return { name, description, url, team_name, team_members }
  }
  
  return null
}

// Helper function to validate URL
function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    try {
      new URL('https://' + string)
      return true
    } catch (_) {
      return false
    }
  }
}

// Test with the exact format
const testMessage = `Project Name: Your Amazing App
Description: This app solves the problem of X by doing Y
URL: https://your-app.com
Team Name: Team Awesome
Team Members: John Doe, Jane Smith`

console.log('🧪 Testing parsing function with exact participant format...\n');
const result = parseProjectMessage(testMessage);
console.log('\n🎯 Final result:', result);
