const axios = require('axios');


//helper functions
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
      const date = ts.split('T')[0]; // only the YYYY-MM-DD part
      counts[date] = (counts[date] || 0) + 1;
    });
  
    const sortedDates = Object.keys(counts).sort();
    const labels = sortedDates;
    const data = sortedDates.map(date => counts[date]);
  
    return { labels, data };
  }  

async function rHandler(req, res) {
    const input = req.query.title;

    if (!input) {
        return res.render('visualizer', { chartData: null, pageTitle: null });
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
        console.log(grouped);
        
        res.render('visualizer', {
            chartData: grouped,
            pageTitle: title
        });

    } catch (err) {
        console.error(err);
        res.render('visualizer', { chartData: null, pageTitle: `Error: ${title}` });
    }
}


module.exports = {rHandler}