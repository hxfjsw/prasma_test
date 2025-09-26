// 加载环境变量
require('dotenv').config();

const express = require("express");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

// 添加JSON中间件
app.use(express.json());

// Serve static files from the dist directory with cache headers
app.use(express.static(path.join(__dirname, "dist"), {
  maxAge: '1y', // 1 year cache for static assets
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Set aggressive caching for static assets
    if (path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp4|webp)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('CDN-Cache-Control', 'max-age=31536000');
      res.setHeader('Vercel-CDN-Cache-Control', 'max-age=31536000');
    }
  }
}));

// Serve index.html for the root route
app.get("/", (req, res) => {
  // Set cache headers for HTML pages
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600');
  res.setHeader('CDN-Cache-Control', 'max-age=3600');
  res.setHeader('Vercel-CDN-Cache-Control', 'max-age=3600');
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// GET /api/users - 获取所有用户
app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('获取用户列表时出错:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      message: error.message
    });
  }
});

// NFT Metadata API endpoint
app.get("/api/metadata/:id.json", (req, res) => {
  const tokenId = req.params.id;
  
  // Set JSON content type
  res.setHeader('Content-Type', 'application/json');
  
  // Set cache headers for API responses
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.setHeader('CDN-Cache-Control', 'max-age=86400');
  res.setHeader('Vercel-CDN-Cache-Control', 'max-age=86400');
  res.setHeader('ETag', `"nft-${tokenId}-v1"`);
  
  // Example metadata structure - you can customize this based on your needs
  const metadata = {
    name: `BTC OG #${tokenId}`,
    description: "BTC OG NFT Collection - Bitcoin's most legendary memes",
    image: `https://btcmeme.club/assets/nft.png`,
    animation_url: `https://www.btcmeme.club/assets/hero.mp4`,
    attributes: [
      {
        trait_type: "Collection",
        value: "BTC OG"
      },
      {
        trait_type: "Token ID",
        value: tokenId
      }
    ]
  };
  
  res.json(metadata);
});

// Handle all other routes by serving index.html (for SPA routing)
app.use((req, res) => {
  // Set cache headers for SPA routes
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600');
  res.setHeader('CDN-Cache-Control', 'max-age=3600');
  res.setHeader('Vercel-CDN-Cache-Control', 'max-age=3600');
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// app.get("/", (req, res) => res.send("Express on Vercel"));

const server = app.listen(3000, () => console.log("Server ready on port 3000."));

// 优雅关闭处理
process.on('SIGINT', async () => {
  console.log('正在关闭服务器...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('正在关闭服务器...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;