// Backend จำลองของ MovieHub
// ทำงานเหมือน API ของทีม Go และเพิ่ม Admin API
// รันด้วย: npm run mock
// พอร์ตเริ่มต้น: 4000
// ข้อมูลเก็บในหน่วยความจำ ปิด Server แล้วข้อมูลจะหาย
// สัญญา API เดิม: docs/db-schema.md หัวข้อ 6 และ 7

const express = require('express');
const cors = require('cors');
let movies = require('./movies.json');

const app = express();

app.use(cors());
app.use(express.json());

// ---------- Log ทุก Request ----------
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode}`);
  });
  next();
});

// ---------- ฐานข้อมูลจำลอง ----------
const db = {
  members: [
    {
      id: 1,
      email: 'demo@moviehub.test',
      password: '1234',
      displayName: 'Demo Member',
      role: 'member',
    },
    {
      id: 2,
      email: 'admin@moviehub.test',
      password: 'admin1234',
      displayName: 'Demo Admin',
      role: 'admin',
    },
  ],
  tokens: new Map(),
  reviews: [],
  votes: [],
  wishlist: [],
};

let nextMemberId = 3;
let nextReviewId = 1;

const publicMember = (member) => ({
  id: member.id,
  email: member.email,
  displayName: member.displayName,
  role: member.role,
});

const findMovie = (id) => movies.find((movie) => movie.id === Number(id));

// ---------- Middleware: ต้องเข้าสู่ระบบ ----------
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : null;

  const memberId = db.tokens.get(token);

  if (!memberId) {
    return res.status(401).json({
      error: 'กรุณาเข้าสู่ระบบก่อน',
    });
  }

  const member = db.members.find((item) => item.id === memberId);

  if (!member) {
    return res.status(401).json({
      error: 'ไม่พบข้อมูลสมาชิก กรุณาเข้าสู่ระบบใหม่',
    });
  }

  req.member = member;
  next();
}

// ---------- Middleware: ต้องเป็น Admin ----------
function requireAdmin(req, res, next) {
  if (req.member.role !== 'admin') {
    return res.status(403).json({
      error: 'คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ',
    });
  }

  next();
}

// ใช้กับทุก Admin API เพื่อให้ตรวจสอบสิทธิ์ทั้ง Login และ Role
const adminOnly = [requireAuth, requireAdmin];

// ---------- หนัง: แสดงรายการ ----------
app.get('/api/movies', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();

  const items = q
    ? movies.filter(
        (movie) =>
          movie.title.toLowerCase().includes(q) ||
          (movie.titleTh || '').toLowerCase().includes(q)
      )
    : movies;

  res.json({ items });
});

// ---------- หนัง: แสดงรายละเอียด ----------
app.get('/api/movies/:id', (req, res) => {
  const movie = findMovie(req.params.id);

  if (!movie) {
    return res.status(404).json({
      error: 'ไม่พบหนังเรื่องนี้',
    });
  }

  const stats = db.votes.filter(
    (vote) => vote.movieId === movie.id
  );

  res.json({
    ...movie,
    memberVoteCount: stats.length,
    memberRating: stats.length
      ? Math.round(
          (stats.reduce((sum, vote) => sum + vote.score, 0) /
            stats.length) *
            10
        ) / 10
      : null,
  });
});

// ---------- สมัครสมาชิก ----------
app.post('/api/auth/register', (req, res) => {
  const {
    email = '',
    password = '',
    displayName = '',
  } = req.body || {};

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof displayName !== 'string' ||
    !email.includes('@') ||
    password.length < 4 ||
    !displayName.trim()
  ) {
    return res.status(400).json({
      error: 'กรอกอีเมล รหัสผ่าน (4 ตัวขึ้นไป) และชื่อที่แสดงให้ครบ',
    });
  }

  if (
    db.members.some(
      (member) =>
        member.email.toLowerCase() === email.trim().toLowerCase()
    )
  ) {
    return res.status(409).json({
      error: 'อีเมลนี้ถูกใช้แล้ว',
    });
  }

  const member = {
    id: nextMemberId++,
    email: email.trim().toLowerCase(),
    password,
    displayName: displayName.trim(),
    role: 'member',
  };

  db.members.push(member);

  res.status(201).json(publicMember(member));
});

// ---------- เข้าสู่ระบบ ----------
app.post('/api/auth/login', (req, res) => {
  const {
    email = '',
    password = '',
  } = req.body || {};

  const member = db.members.find(
    (item) => item.email === email.toLowerCase()
  );

  if (!member || member.password !== password) {
    return res.status(401).json({
      error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    });
  }

  const token = `mock.${member.id}.${Math.random()
    .toString(36)
    .slice(2)}`;

  db.tokens.set(token, member.id);

  res.json({
    token,
    member: publicMember(member),
  });
});

// ---------- ข้อมูลสมาชิกที่ Login อยู่ ----------
app.get('/api/me', requireAuth, (req, res) => {
  res.json(publicMember(req.member));
});

// ==================================================
// ADMIN API
// ทุก Endpoint ต้อง Login และมี role เป็น admin
// ==================================================

// ---------- Dashboard: สถิติ ----------
app.get('/api/admin/stats', ...adminOnly, (req, res) => {
  res.json({
    movieCount: movies.length,
    memberCount: db.members.length,
    adminCount: db.members.filter(
      (member) => member.role === 'admin'
    ).length,
    voteCount: db.votes.length,
    wishlistCount: db.wishlist.length,
    reviewCount: db.reviews.length,
  });
});

// ---------- Admin: รายชื่อสมาชิก ----------
app.get('/api/admin/members', ...adminOnly, (req, res) => {
  const items = db.members.map(publicMember);

  res.json({ items });
});

// ---------- Admin: เปลี่ยน Role สมาชิก ----------
app.put(
  '/api/admin/members/:id/role',
  ...adminOnly,
  (req, res) => {
    const memberId = Number(req.params.id);
    const { role } = req.body || {};

    if (!Number.isInteger(memberId)) {
      return res.status(400).json({
        error: 'รหัสสมาชิกไม่ถูกต้อง',
      });
    }

    if (!['member', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'role ต้องเป็น member หรือ admin เท่านั้น',
      });
    }

    // ป้องกัน Admin เปลี่ยน Role ของตัวเอง
    if (memberId === req.member.id) {
      return res.status(400).json({
        error: 'ไม่สามารถเปลี่ยน Role ของบัญชีตัวเองได้',
      });
    }

    const member = db.members.find(
      (item) => item.id === memberId
    );

    if (!member) {
      return res.status(404).json({
        error: 'ไม่พบสมาชิก',
      });
    }

    member.role = role;

    res.json(publicMember(member));
  }
);

// ---------- Admin: ดูรายละเอียดหนัง ----------
app.get(
  '/api/admin/movies/:id',
  ...adminOnly,
  (req, res) => {
    const movie = findMovie(req.params.id);

    if (!movie) {
      return res.status(404).json({
        error: 'ไม่พบหนังเรื่องนี้',
      });
    }

    res.json(movie);
  }
);

// ---------- Admin: เพิ่มหนัง ----------
app.post('/api/admin/movies', ...adminOnly, (req, res) => {
  const {
    title = '',
    titleTh = '',
    year,
    genre = '',
    genreTh = '',
    detail = '',
    poster = '',
    tmdbId = null,
    rating = 0,
    list = [],
  } = req.body || {};

  if (
    typeof title !== 'string' ||
    !title.trim() ||
    typeof titleTh !== 'string' ||
    !Number.isInteger(Number(year)) ||
    Number(year) < 1888 ||
    Number(year) > 2100
  ) {
    return res.status(400).json({
      error: 'กรุณาระบุชื่อหนังและปีที่ฉายให้ถูกต้อง',
    });
  }

  const numericIds = movies
    .map((movie) => Number(movie.id))
    .filter(Number.isFinite);

  const newId = numericIds.length
    ? Math.max(...numericIds) + 1
    : 1;

  const movie = {
    id: newId,
    tmdbId,
    title: title.trim(),
    titleTh: titleTh.trim(),
    genre,
    genreTh,
    year: Number(year),
    rating: Number(rating) || 0,
    detail,
    poster,
    list: Array.isArray(list) ? list : [],
  };

  movies.push(movie);

  res.status(201).json(movie);
});

// ---------- Admin: แก้ไขหนัง ----------
app.put(
  '/api/admin/movies/:id',
  ...adminOnly,
  (req, res) => {
    const movie = findMovie(req.params.id);

    if (!movie) {
      return res.status(404).json({
        error: 'ไม่พบหนังเรื่องนี้',
      });
    }

    const {
      title,
      titleTh,
      year,
      genre,
      genreTh,
      detail,
      poster,
      tmdbId,
      rating,
      list,
    } = req.body || {};

    if (
      title !== undefined &&
      (typeof title !== 'string' || !title.trim())
    ) {
      return res.status(400).json({
        error: 'ชื่อหนังไม่ถูกต้อง',
      });
    }

    if (
      year !== undefined &&
      (!Number.isInteger(Number(year)) ||
        Number(year) < 1888 ||
        Number(year) > 2100)
    ) {
      return res.status(400).json({
        error: 'ปีที่ฉายไม่ถูกต้อง',
      });
    }

    if (title !== undefined) movie.title = title.trim();
    if (titleTh !== undefined) movie.titleTh = titleTh;
    if (year !== undefined) movie.year = Number(year);
    if (genre !== undefined) movie.genre = genre;
    if (genreTh !== undefined) movie.genreTh = genreTh;
    if (detail !== undefined) movie.detail = detail;
    if (poster !== undefined) movie.poster = poster;
    if (tmdbId !== undefined) movie.tmdbId = tmdbId;
    if (rating !== undefined) movie.rating = Number(rating) || 0;
    if (Array.isArray(list)) movie.list = list;

    res.json(movie);
  }
);

// ---------- Admin: ลบหนัง ----------
app.delete(
  '/api/admin/movies/:id',
  ...adminOnly,
  (req, res) => {
    const movieId = Number(req.params.id);
    const index = movies.findIndex(
      (movie) => movie.id === movieId
    );

    if (index < 0) {
      return res.status(404).json({
        error: 'ไม่พบหนังเรื่องนี้',
      });
    }

    movies.splice(index, 1);

    // ลบข้อมูลที่เกี่ยวข้องกับหนังเรื่องนี้ด้วย
    db.reviews = db.reviews.filter(
      (review) => review.movieId !== movieId
    );
    db.votes = db.votes.filter(
      (vote) => vote.movieId !== movieId
    );
    db.wishlist = db.wishlist.filter(
      (item) => item.movieId !== movieId
    );

    res.status(204).end();
  }
);

// ==================================================
// รีวิว
// ==================================================

app.get('/api/movies/:id/reviews', (req, res) => {
  const movieId = Number(req.params.id);

  const items = db.reviews
    .filter((review) => review.movieId === movieId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((review) => {
      const member = db.members.find(
        (item) => item.id === review.memberId
      );

      const vote = db.votes.find(
        (item) =>
          item.memberId === review.memberId &&
          item.movieId === movieId
      );

      return {
        id: review.id,
        text: review.text,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        member: {
          id: member?.id,
          displayName: member?.displayName || 'สมาชิก',
        },
        score: vote ? vote.score : null,
      };
    });

  res.json({ items });
});

app.post(
  '/api/movies/:id/reviews',
  requireAuth,
  (req, res) => {
    const movieId = Number(req.params.id);
    const text = (req.body?.text || '').trim();

    if (!findMovie(movieId)) {
      return res.status(404).json({
        error: 'ไม่พบหนังเรื่องนี้',
      });
    }

    if (text.length < 10) {
      return res.status(400).json({
        error: 'รีวิวสั้นเกินไป',
      });
    }

    if (
      db.reviews.some(
        (review) =>
          review.memberId === req.member.id &&
          review.movieId === movieId
      )
    ) {
      return res.status(409).json({
        error: 'คุณรีวิวเรื่องนี้ไปแล้ว',
      });
    }

    const now = new Date().toISOString();

    const review = {
      id: nextReviewId++,
      memberId: req.member.id,
      movieId,
      text,
      createdAt: now,
      updatedAt: now,
    };

    db.reviews.push(review);

    res.status(201).json({
      id: review.id,
      text,
      createdAt: now,
    });
  }
);

app.delete(
  '/api/reviews/:reviewId',
  requireAuth,
  (req, res) => {
    const index = db.reviews.findIndex(
      (review) =>
        review.id === Number(req.params.reviewId) &&
        review.memberId === req.member.id
    );

    if (index < 0) {
      return res.status(404).json({
        error: 'ไม่พบรีวิว',
      });
    }

    db.reviews.splice(index, 1);

    res.status(204).end();
  }
);

// ==================================================
// คะแนนหนัง
// ==================================================

app.put(
  '/api/movies/:id/vote',
  requireAuth,
  (req, res) => {
    const movieId = Number(req.params.id);
    const score = req.body?.score;

    if (!findMovie(movieId)) {
      return res.status(404).json({
        error: 'ไม่พบหนังเรื่องนี้',
      });
    }

    if (
      !Number.isInteger(score) ||
      score < 1 ||
      score > 10
    ) {
      return res.status(400).json({
        error: 'score ต้องเป็นจำนวนเต็ม 1 ถึง 10',
      });
    }

    const existing = db.votes.find(
      (vote) =>
        vote.memberId === req.member.id &&
        vote.movieId === movieId
    );

    if (existing) {
      existing.score = score;
    } else {
      db.votes.push({
        memberId: req.member.id,
        movieId,
        score,
      });
    }

    res.json({ movieId, score });
  }
);

app.delete(
  '/api/movies/:id/vote',
  requireAuth,
  (req, res) => {
    const movieId = Number(req.params.id);

    db.votes = db.votes.filter(
      (vote) =>
        !(
          vote.memberId === req.member.id &&
          vote.movieId === movieId
        )
    );

    res.status(204).end();
  }
);

// ==================================================
// Wishlist
// ==================================================

app.get('/api/me/wishlist', requireAuth, (req, res) => {
  const items = db.wishlist
    .filter((item) => item.memberId === req.member.id)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .map((item) => ({
      ...(findMovie(item.movieId) || {
        id: item.movieId,
        title: `หนัง #${item.movieId}`,
      }),
      note: item.note,
      addedAt: item.addedAt,
    }));

  res.json({ items });
});

app.put(
  '/api/me/wishlist/:movieId',
  requireAuth,
  (req, res) => {
    const movieId = Number(req.params.movieId);
    const existing = db.wishlist.find(
      (item) =>
        item.memberId === req.member.id &&
        item.movieId === movieId
    );

    const note = req.body?.note ?? null;

    if (existing) {
      existing.note = note;
    } else {
      db.wishlist.push({
        memberId: req.member.id,
        movieId,
        note,
        addedAt: new Date().toISOString(),
      });
    }

    res.json({ movieId, note });
  }
);

app.delete(
  '/api/me/wishlist/:movieId',
  requireAuth,
  (req, res) => {
    const movieId = Number(req.params.movieId);

    db.wishlist = db.wishlist.filter(
      (item) =>
        !(
          item.memberId === req.member.id &&
          item.movieId === movieId
        )
    );

    res.status(204).end();
  }
);

// ---------- Endpoint ที่ไม่พบ ----------
app.use('/api', (req, res) => {
  res.status(404).json({
    error: `ไม่มี endpoint ${req.method} ${req.originalUrl}`,
  });
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MovieHub mock backend พร้อมที่ http://localhost:${PORT}`);
  console.log('สมาชิก: demo@moviehub.test / 1234');
  console.log('Admin: admin@moviehub.test / admin1234');
  console.log('ข้อมูลทั้งหมดหายเมื่อปิด Server');
});