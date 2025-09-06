# AI Summarizer Bot Feature

ConnectSphere now includes an AI-powered summarizer bot that can generate intelligent summaries of channel conversations using Google's Gemini AI.

## Features

### 1. AI Bot Integration
- **AIBot** appears as a regular member in all servers
- Distinctive blue styling and bot icon for easy identification
- Cannot be edited or deleted by regular users

### 2. `/summarize` Command
- Type `/summarize` in any channel to get a summary of recent messages
- Optional parameter: `/summarize [number]` to specify message count (10-200)
- Default: Analyzes last 50 messages
- Generates 3-5 bullet points covering:
  - Main topics discussed
  - Key decisions or conclusions
  - Important information shared
  - Action items mentioned

### 3. Real-time Processing
- Shows loading message while generating summary
- Updates message with actual summary when complete
- Integrates with existing Socket.IO real-time system

### 4. Summary Storage
- All summaries are stored in the database
- Can be retrieved later via API
- Tracks message count and timestamp

### 5. Daily Automated Summaries
- Optional daily summaries at midnight for active channels
- Only triggers for channels with 5+ messages in 24 hours
- Automatic posting with clear daily summary formatting

## Setup Instructions

### 1. Database Migration
Run the Prisma migration to add the new schema:
```bash
npx prisma db push
```

### 2. Environment Variables
Add your Google Gemini API key to `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

### 3. Add AI Bot to Existing Servers
Run the setup script to add the AI bot to existing servers:
```bash
npx tsx scripts/setup-ai-bot.ts
```

### 4. Optional: Daily Summary Cron Job
For automated daily summaries, set up a cron job to call:
```
POST /api/cron/daily-summary
```

For Vercel, add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/daily-summary",
    "schedule": "0 0 * * *"
  }]
}
```

## Usage

### Manual Summaries
1. Type `/summarize` in any channel
2. Optionally specify message count: `/summarize 100`
3. Wait for AIBot to generate and post the summary

### Command Suggestions
- Start typing `/` to see available commands
- Click on `/summarize` suggestion for auto-completion

### Bot Message Styling
- Bot messages have blue accent border and background
- Special bot icon and blue name styling
- Cannot be edited or deleted by users
- Formatted content with proper spacing

## Technical Implementation

### New Database Models
- `Profile.isBot` - Identifies bot accounts
- `Summary` - Stores generated summaries with metadata

### API Endpoints
- `POST /api/socket/messages` - Enhanced to handle `/summarize` commands
- `GET /api/summaries` - Retrieve channel summaries
- `POST /api/cron/daily-summary` - Daily summary generation

### Components Updated
- `ChatItem` - Special styling for bot messages
- `ChatInput` - Command suggestions and auto-complete

### AI Integration
- Google Gemini Pro model for text generation
- Intelligent filtering of bot messages from analysis
- Error handling and fallback messages
- Configurable prompt engineering

## Security & Performance

### Security
- Bot commands only work for server members
- API key stored securely in environment variables
- Optional cron secret for webhook protection

### Performance
- Asynchronous summary generation
- Message count limits (10-200)
- Efficient database queries with proper indexing
- Loading states for better UX

## Customization

### Modify AI Prompts
Edit `lib/ai-service.ts` to customize:
- Summary format and style
- Analysis focus areas
- Response length and structure

### Bot Appearance
Update `lib/ai-bot.ts` to change:
- Bot name and avatar
- Default permissions and role

### Command Behavior
Modify `pages/api/socket/messages/index.ts` for:
- Additional commands
- Different trigger patterns
- Custom response formats

## Troubleshooting

### Common Issues
1. **"No AI bot found"** - Run the setup script
2. **"API key missing"** - Check GEMINI_API_KEY in .env
3. **"Unauthorized"** - Verify user has server access
4. **Summary not generating** - Check API key and network connectivity

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
```

## Future Enhancements

Potential improvements:
- Multiple AI models support
- Custom summary templates per channel
- Summary scheduling per channel
- Integration with other AI services
- Advanced command parsing
- Summary analytics and insights