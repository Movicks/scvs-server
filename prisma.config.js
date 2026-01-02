"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const config_1 = require("prisma/config");
dotenv_1.default.config({ override: true });
function ensureDbName(input) {
    const fallback = 'mongodb://localhost:27017/scvs';
    let url = (input || '').trim();
    if (!url)
        return fallback;
    url = url.replace(/\s+/g, '');
    const m = url.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(?:\/([^?]*))?(\?.*)?$/i);
    if (!m)
        return fallback;
    const base = m[1];
    const pathDb = m[2] || '';
    const query = m[3] || '';
    const db = pathDb && pathDb !== '' ? pathDb : 'scvs';
    return `${base}/${db}${query}`;
}
const raw = process.env.DATABASE_URL;
const url = ensureDbName(raw);
console.log('[PrismaConfig] Using DATABASE_URL =', url);
exports.default = (0, config_1.defineConfig)({
    schema: 'prisma/schema.prisma',
    datasource: {
        url,
    },
});
//# sourceMappingURL=prisma.config.js.map