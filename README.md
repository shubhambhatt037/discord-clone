# Discord Clone

Welcome to the Discord Clone repository! This project aims to recreate the functionality of Discord, a popular communication platform, using modern web technologies.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Features

- **Real-Time Messaging:** Utilizes Socket.io for instant messaging between users.
- **Attachments:** Users can send attachments as messages using UploadThing.
- **Message Management:** Users can delete and edit messages in real time.
- **Communication Channels:** Create text, audio, and video call channels for group communication.
- **1:1 Conversations:** Members can engage in private conversations with each other.
- **Video Calls:** Conduct 1:1 video calls between members for face-to-face communication.
- **Member Management:** Administrators have the ability to manage members, including kicking and changing roles.
- **Invite System:** Generate unique invite links for inviting new members to the server.
- **Message Loading:** Messages load infinitely in batches of 10 for smooth scrolling and navigation.
- **Server Customization:** Users can create and customize their own servers.
- **User Interface:** Beautiful UI design using TailwindCSS and ShadcnUI, with support for light and dark mode.
- **Responsiveness:** Fully responsive design ensures optimal user experience across all devices.
- **Websocket Fallback:** Fallback mechanism ensures seamless communication even in environments where websockets are not supported.
- **ORM:** Utilizes Prisma for object-relational mapping.
- **Database:** MySQL database managed using Planetscale for scalability and reliability.
- **Authentication:** Integrated authentication system using Clerk for secure user authentication.

## Technologies Used

- Next.js
- Socket.io
- MySQL
- React
- Prisma
- Tailwind CSS

## Setup and Usage

1. Clone the repository:

   ```bash
   git clone git@github.com:shubhambhatt037/discord-clone.git
   ```

2. Install Dependencies:

   ```bash
   cd discord-clone
   npm install
   ```
   Set up the database and environment variables as specified in the documentation.

3. Run the application:

   ```bash
   npm run dev
   ```
   Access the Discord clone through the provided URL.

## Contributing

Contributions are welcome! If you'd like to contribute to this project, please follow these guidelines:
- Fork the repository.
- Create a new branch for your feature or bug fix.
- Make your changes and submit a pull request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Special thanks to the Socket.io and Prisma communities for their excellent tools and support.
- Thanks to the Next.js and React communities for their extensive documentation and resources.

# Contact

If you would like to contact me, you can reach me at shubhambhatt037@gmail.com.
