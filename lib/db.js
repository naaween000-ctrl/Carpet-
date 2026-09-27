const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Paths for local JSON fallback storage
const DATA_DIR = path.join(__dirname, '..', 'data');
const CARPETS_FILE = path.join(DATA_DIR, 'carpets.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ── SUPABASE CLIENT INITIALIZATION ───────────────────────
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-ref') && !supabaseKey.includes('your-supabase')) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('⚡ Supabase client initialized successfully.');
    } catch (e) {
        console.warn('⚠️ Supabase initialization error:', e.message);
    }
} else {
    console.log('ℹ️ Supabase credentials not found in env. Running with local storage fallback.');
}

// Default site settings
const defaultSettings = {
    img_heritage: 'https://images.unsplash.com/photo-1596707323565-5c1cf4c4391b?auto=format&fit=crop&w=1000&q=80',
    img_weaving: 'https://images.unsplash.com/photo-1601053073740-456015b6d7a4?auto=format&fit=crop&w=1000&q=80',
    img_sustainable: 'https://images.unsplash.com/photo-1620612450529-68d7124fcae1?auto=format&fit=crop&w=1000&q=80',
    img_factory1: '',
    img_factory2: '',
    img_factory3: '',
    img_factory4: '',
    contact_address: 'Carpet Manufacturers & Exporters\nChauri Road, Bhadohi - 221401\nUttar Pradesh, India',
    contact_phone1: '+91 8299501435, +91 9918003355',
    contact_phone2: '+91 9839915423, +91 9415225423',
    contact_email: 'tmproducts.bhadohi@gmail.com',
};

// Local JSON Helpers
function readJson(filePath, defaultValue = []) {
    try {
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err);
    }
    return defaultValue;
}

function writeJson(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error(`Error writing ${filePath}:`, err);
    }
}

// Helper to normalize carpet object from database
function normalizeCarpet(item) {
    return {
        id: item.id,
        name: item.name || '',
        category: item.category || '',
        imageUrl: item.imageUrl || item.image_url || '',
        description: item.description || '',
        material: item.material || '',
        origin: item.origin || '',
        knots: item.knots || '',
        washing: item.washing || '',
        face: item.face || '',
        sizes: Array.isArray(item.sizes) ? item.sizes : (typeof item.sizes === 'string' ? JSON.parse(item.sizes) : []),
        createdAt: item.createdAt || item.created_at || null,
    };
}

// ── CARPETS ──────────────────────────────────────────────

const getCarpets = async () => {
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('carpets')
                .select('*')
                .order('created_at', { ascending: true, nullsFirst: false });
            
            if (!error && data) {
                return data.map(normalizeCarpet);
            }
            console.warn('Supabase getCarpets table query warning:', error?.message);
        } catch (error) {
            console.error('Supabase getCarpets error:', error);
        }
    }
    // Fallback to JSON file
    return readJson(CARPETS_FILE, []);
};

const addCarpet = async (carpetData) => {
    const id = uuidv4();
    const newCarpet = {
        id,
        name: carpetData.name || '',
        category: carpetData.category || '',
        imageUrl: carpetData.imageUrl || '',
        description: carpetData.description || '',
        material: carpetData.material || '',
        origin: carpetData.origin || '',
        knots: carpetData.knots || '',
        washing: carpetData.washing || '',
        face: carpetData.face || '',
        sizes: carpetData.sizes || [],
    };

    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('carpets')
                .insert([{
                    id: newCarpet.id,
                    name: newCarpet.name,
                    category: newCarpet.category,
                    imageUrl: newCarpet.imageUrl,
                    image_url: newCarpet.imageUrl,
                    description: newCarpet.description,
                    material: newCarpet.material,
                    origin: newCarpet.origin,
                    knots: newCarpet.knots,
                    washing: newCarpet.washing,
                    face: newCarpet.face,
                    sizes: newCarpet.sizes,
                }])
                .select();
            
            if (!error) {
                return id;
            }
            console.warn('Supabase addCarpet error, falling back to local file:', error.message);
        } catch (error) {
            console.error('Supabase addCarpet error:', error);
        }
    }

    // Fallback local save
    const carpets = readJson(CARPETS_FILE, []);
    carpets.push({ ...newCarpet, createdAt: new Date().toISOString() });
    writeJson(CARPETS_FILE, carpets);
    return id;
};

const deleteCarpet = async (id) => {
    if (supabase) {
        try {
            const { error } = await supabase
                .from('carpets')
                .delete()
                .eq('id', id);
            
            if (!error) return;
            console.warn('Supabase deleteCarpet error:', error.message);
        } catch (error) {
            console.error('Supabase deleteCarpet error:', error);
        }
    }

    // Fallback local delete
    const carpets = readJson(CARPETS_FILE, []);
    const filtered = carpets.filter(c => c.id !== id);
    writeJson(CARPETS_FILE, filtered);
};

const updateCarpet = async (id, carpetData) => {
    const cleanData = {
        name: carpetData.name,
        category: carpetData.category,
        imageUrl: carpetData.imageUrl,
        image_url: carpetData.imageUrl,
        description: carpetData.description,
        material: carpetData.material,
        origin: carpetData.origin,
        knots: carpetData.knots,
        washing: carpetData.washing,
        face: carpetData.face,
        sizes: carpetData.sizes || [],
    };

    if (supabase) {
        try {
            const { error } = await supabase
                .from('carpets')
                .update(cleanData)
                .eq('id', id);
            
            if (!error) return;
            console.warn('Supabase updateCarpet error:', error.message);
        } catch (error) {
            console.error('Supabase updateCarpet error:', error);
        }
    }

    // Fallback local update
    const carpets = readJson(CARPETS_FILE, []);
    const index = carpets.findIndex(c => c.id === id);
    if (index !== -1) {
        carpets[index] = { ...carpets[index], ...carpetData };
        writeJson(CARPETS_FILE, carpets);
    }
};

// ── SITE SETTINGS ────────────────────────────────────────

const getSettings = async () => {
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .eq('id', 'siteSettings')
                .maybeSingle();

            if (!error && data) {
                const settingsData = data.settings_data || data;
                return { ...defaultSettings, ...settingsData };
            }
        } catch (error) {
            console.error('Supabase getSettings error:', error);
        }
    }

    // Fallback local read
    const local = readJson(SETTINGS_FILE, null);
    if (local) {
        return { ...defaultSettings, ...local };
    }
    return defaultSettings;
};

const saveSettings = async (settingsData) => {
    if (supabase) {
        try {
            const { error } = await supabase
                .from('site_settings')
                .upsert({
                    id: 'siteSettings',
                    settings_data: settingsData,
                    ...settingsData,
                    updated_at: new Date().toISOString()
                });

            if (!error) return;
            console.warn('Supabase saveSettings error:', error.message);
        } catch (error) {
            console.error('Supabase saveSettings error:', error);
        }
    }

    // Fallback local save
    const current = await getSettings();
    const updated = { ...current, ...settingsData };
    writeJson(SETTINGS_FILE, updated);
};

// ── MESSAGES ─────────────────────────────────────────────

const addMessage = async (messageData) => {
    const newMessage = {
        id: uuidv4(),
        name: messageData.name || '',
        email: messageData.email || '',
        phone: messageData.phone || '',
        interest: messageData.interest || '',
        message: messageData.message || '',
        created_at: new Date().toISOString()
    };

    if (supabase) {
        try {
            const { error } = await supabase
                .from('messages')
                .insert([newMessage]);

            if (!error) return;
            console.warn('Supabase addMessage error:', error.message);
        } catch (error) {
            console.error('Supabase addMessage error:', error);
        }
    }

    // Fallback local save
    const messages = readJson(MESSAGES_FILE, []);
    messages.unshift(newMessage);
    writeJson(MESSAGES_FILE, messages);
};

const getMessages = async () => {
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                return data.map(m => ({
                    id: m.id,
                    name: m.name,
                    email: m.email,
                    phone: m.phone,
                    interest: m.interest,
                    message: m.message,
                    createdAt: m.created_at || m.createdAt
                }));
            }
        } catch (error) {
            console.error('Supabase getMessages error:', error);
        }
    }

    // Fallback local read
    return readJson(MESSAGES_FILE, []);
};

const deleteMessage = async (id) => {
    if (supabase) {
        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', id);

            if (!error) return;
            console.warn('Supabase deleteMessage error:', error.message);
        } catch (error) {
            console.error('Supabase deleteMessage error:', error);
        }
    }

    // Fallback local delete
    const messages = readJson(MESSAGES_FILE, []);
    const filtered = messages.filter(m => m.id !== id);
    writeJson(MESSAGES_FILE, filtered);
};

module.exports = {
    getCarpets, addCarpet, deleteCarpet, updateCarpet,
    getSettings, saveSettings,
    addMessage, getMessages, deleteMessage
};
