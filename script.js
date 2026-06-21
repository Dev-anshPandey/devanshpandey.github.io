/**
 * script.js
 * Handles scroll reveal intersections, mouse-tracking spotlights, interactive mockups, and accordions.
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Scroll Reveal Logic (Intersection Observer)
  const sections = document.querySelectorAll('.section');
  const tocLinks = document.querySelectorAll('.side-toc a');
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        
        // Update TOC
        const id = entry.target.getAttribute('id');
        tocLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(sec => {
    if (sec.id !== 'hero') {
      observer.observe(sec);
    }
  });

  // 2. Mouse Tracking Spotlight for Bento Cards
  const bentoCards = document.querySelectorAll('.bento-card');

  bentoCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // 3. Interactive Mockup Tabs in Hero
  const tabs = document.querySelectorAll('.mockup-tab');
  const mockupContent = document.getElementById('mockup-content');

  const snippets = {
    'tech': `
<pre><code><span class="keyword">const</span> developer = {
  <span class="string">role</span>: <span class="string">'Frontend & Mobile'</span>,
  <span class="string">tools</span>: [<span class="string">'React Native'</span>, <span class="string">'Flutter'</span>, <span class="string">'TypeScript'</span>],
  <span class="function">optimize</span>: () => {
    <span class="keyword">return</span> <span class="string">'60fps stable performance'</span>;
  }
};</code></pre>`,
    
    'focus': `
<pre><code><span class="keyword">from</span> fastapi <span class="keyword">import</span> FastAPI
<span class="keyword">from</span> pydantic <span class="keyword">import</span> BaseModel

app = <span class="function">FastAPI</span>()

<span class="keyword">class</span> Query(BaseModel):
    prompt: <span class="keyword">str</span>

<span class="keyword">@app.post</span>(<span class="string">"/generate"</span>)
<span class="keyword">async def</span> <span class="function">generate_response</span>(q: Query):
    <span class="keyword">return</span> {<span class="string">"status"</span>: <span class="string">"Transitioning to AI Engineering"</span>}</code></pre>`
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const target = tab.getAttribute('data-target');
      if (snippets[target]) {
        mockupContent.style.opacity = 0;
        setTimeout(() => {
          mockupContent.innerHTML = snippets[target];
          mockupContent.style.opacity = 1;
        }, 150);
      }
    });
  });

  // 4. Accordion Logic for Experience Section
  const accordions = document.querySelectorAll('.accordion-header');
  
  accordions.forEach(header => {
    header.addEventListener('click', () => {
      const parent = header.parentElement;
      
      // Close all others
      document.querySelectorAll('.accordion-item').forEach(item => {
        if (item !== parent) {
          item.classList.remove('expanded');
        }
      });
      
      // Toggle current
      parent.classList.toggle('expanded');
    });
  });

  // 5. Github Graph Mock generation
  const ghGraph = document.querySelector('.github-graph');
  if (ghGraph) {
    for (let i = 0; i < 48; i++) {
      const cell = document.createElement('div');
      ghGraph.appendChild(cell);
    }
  }

});
