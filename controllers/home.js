const axios = require('axios');
function extractTitle(input) {
    try {
      const url = new URL(input);
      return decodeURIComponent(url.pathname.split('/').pop());
    } catch (e) {
      return input.trim();
    }
  }
  function groupEditsByDate(timestamps) {
    const counts = {};
    timestamps.forEach(ts => {
      const date = ts.split('T')[0]; 
      counts[date] = (counts[date] || 0) + 1;
    });
    const sortedDates = Object.keys(counts).sort();
    const labels = sortedDates;
    const data = sortedDates.map(date => counts[date]);
    return { labels, data };
  }  
  function computeWordFrequencies(text) {
    const stopwords = new Set([
        'the','and','of','to','in','a','is','for','on','with','as','by','at','from','it','an','be','this','that','are','was','or','which','but','not','have','has','had','were','their','they','its','also','can','will','one','all','we','more','other','about','his','her','he','she','you','i','my','your','our','us','them','so','if','no','do','out','up','who','what','when','where','why','how','than','then','into','over','after','before','such','these','those','may','like','just','some','any','each','most','many','been','because','between','during','through','both','under','while','should','could','would','did','does','having','get','got','made','make','using','used','use','see','seen','per','etc','etc.'
    ]);
    const freq = {};
    text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).forEach(word => {
        if (word && !stopwords.has(word) && word.length > 2) {
            freq[word] = (freq[word] || 0) + 1;
        }
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 100);
}
async function editsHandler(req, res) {
    const input = req.query.title;
    if (!input) {
        if (req.query.preview === '1') return res.json({ labels: [], data: [] });
        return res.render('edits', { chartData: null, title: null, error: null });
    }
    const title = extractTitle(input);
    let timestamps = [];
    let continueToken = null;
    try {
        do {
            const response = await axios.get('https://en.wikipedia.org/w/api.php', {
                params: {
                    action: 'query',
                    prop: 'revisions',
                    titles: title,
                    rvlimit: '500',
                    rvprop: 'timestamp',
                    format: 'json',
                    rvcontinue: continueToken,
                }
            });
            const pages = response.data.query.pages;
            const page = Object.values(pages)[0];
            if (page.revisions) {
                timestamps.push(...page.revisions.map(r => r.timestamp));
            }
            continueToken = response.data.continue?.rvcontinue;
        } while (continueToken);
        const grouped = groupEditsByDate(timestamps);
        if (req.query.preview === '1') {
            const n = 5;
            const len = grouped.labels.length;
            return res.json({
                labels: grouped.labels.slice(len-n < 0 ? 0 : len-n, len),
                data: grouped.data.slice(len-n < 0 ? 0 : len-n, len)
            });
        }
        res.render('edits', {
            chartData: grouped,
            title: title,
            error: null
        });
    } catch (err) {
        console.error(err);
        if (req.query.preview === '1') return res.json({ labels: [], data: [] });
        res.render('edits', { chartData: null, title: title, error: 'Error fetching data.' });
    }
}
async function wordCloudHandler(req, res) {
    const input = req.query.title;
    if (!input) {
        if (req.query.preview === '1') return res.json([]);
        return res.render('wordcloud', { title: null, wordFrequencies: [], error: null });
    }
    const title = extractTitle(input);
    try {
        const response = await axios.get('https://en.wikipedia.org/w/api.php', {
            params: {
                action: 'query',
                prop: 'extracts',
                titles: title,
                format: 'json',
                explaintext: 1,
                redirects: 1
            }
        });
        const pages = response.data.query.pages;
        const page = Object.values(pages)[0];
        if (!page.extract) {
            if (req.query.preview === '1') return res.json([]);
            return res.render('wordcloud', { title, wordFrequencies: [], error: 'No content found for this page.' });
        }
        const wordFrequencies = computeWordFrequencies(page.extract);
        if (req.query.preview === '1') {
            return res.json(wordFrequencies.slice(0, 5));
        }
        res.render('wordcloud', { title, wordFrequencies, error: null });
    } catch (err) {
        console.error(err);
        if (req.query.preview === '1') return res.json([]);
        res.render('wordcloud', { title, wordFrequencies: [], error: 'Error fetching or processing data.' });
    }
}
async function topEditorsHandler(req, res) {
    const input = req.query.title;
    if (!input) {
        if (req.query.preview === '1') return res.json([]);
        return res.render('topeditors', { title: null, editors: [], error: null });
    }
    const title = extractTitle(input);
    let continueToken = null;
    let editorsMap = {};
    try {
        do {
            const response = await axios.get('https://en.wikipedia.org/w/api.php', {
                params: {
                    action: 'query',
                    prop: 'revisions',
                    titles: title,
                    rvlimit: '500',
                    rvprop: 'user',
                    format: 'json',
                    rvcontinue: continueToken,
                }
            });
            const pages = response.data.query.pages;
            const page = Object.values(pages)[0];
            if (page.revisions) {
                page.revisions.forEach(r => {
                    if (r.user) {
                        editorsMap[r.user] = (editorsMap[r.user] || 0) + 1;
                    }
                });
            }
            continueToken = response.data.continue?.rvcontinue;
        } while (continueToken);
        const editors = Object.entries(editorsMap)
            .map(([user, count]) => ({ user, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); 
        if (req.query.preview === '1') {
            return res.json(editors.slice(0, 3));
        }
        res.render('topeditors', { title, editors, error: null });
    } catch (err) {
        console.error(err);
        if (req.query.preview === '1') return res.json([]);
        res.render('topeditors', { title, editors: [], error: 'Error fetching or processing data.' });
    }
}
async function timelineHandler(req, res) {
    const input = req.query.title;
    if (!input) {
        if (req.query.preview === '1') return res.json([]);
        return res.render('timeline', { title: null, timeline: [], error: null });
    }
    const title = extractTitle(input);
    let continueToken = null;
    let timeline = [];
    try {
        do {
            const response = await axios.get('https://en.wikipedia.org/w/api.php', {
                params: {
                    action: 'query',
                    prop: 'revisions',
                    titles: title,
                    rvlimit: '100', 
                    rvprop: 'timestamp|user|comment',
                    format: 'json',
                    rvcontinue: continueToken,
                }
            });
            const pages = response.data.query.pages;
            const page = Object.values(pages)[0];
            if (page.revisions) {
                timeline.push(...page.revisions.map(r => ({
                    timestamp: r.timestamp,
                    user: r.user,
                    comment: r.comment || ''
                })));
            }
            continueToken = response.data.continue?.rvcontinue;
        } while (continueToken && timeline.length < 500); 
        timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        if (req.query.preview === '1') {
            return res.json(timeline.slice(-3));
        }
        res.render('timeline', { title, timeline, error: null });
    } catch (err) {
        console.error(err);
        if (req.query.preview === '1') return res.json([]);
        res.render('timeline', { title, timeline: [], error: 'Error fetching or processing data.' });
    }
}
module.exports = {  editsHandler, wordCloudHandler, topEditorsHandler, timelineHandler };