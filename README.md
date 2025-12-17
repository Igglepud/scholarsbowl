# Scholars Bowl Space Presentation

An interactive 3D presentation using Three.js where stars swarm together to form text and the camera zooms through space between topics.

## Files

- **index.html** - Main HTML file, open this in a browser
- **presentation.js** - JavaScript code for the 3D effects and presentation logic
- **content.json** - All presentation text (EDIT THIS FILE for your content)

## How to Use

1. Open `index.html` in a web browser (Chrome, Firefox, Edge recommended)
2. Click anywhere or press Space/Enter/Right Arrow to advance
3. The presentation will:
   - Show bullet points forming from swirling stars
   - Zoom through space when transitioning to new topics
   - Loop back to the beginning when finished

## Editing Content

Edit `content.json` to change all presentation text. The format is:

```json
{
  "title": "SCHOLARS BOWL",
  "slides": [
    {
      "topic": "TOPIC NAME",
      "bullets": [
        "FIRST BULLET POINT",
        "SECOND BULLET POINT",
        "THIRD BULLET POINT"
      ]
    }
  ]
}
```

- Each slide has a topic and multiple bullet points
- Bullet points appear one at a time with star swirl animation
- After all bullets, camera zooms to the next topic
- Use ALL CAPS for best visual effect
- Keep text relatively short (words, not sentences)

## Features

- 3D starfield background that slowly rotates
- 3000+ particle system that forms text
- Smooth swirling animation when particles gather into words
- Hyperspace zoom effect between topics
- Particles gently float when formed into text
- Click or keyboard navigation
- Responsive to window resizing

## Tips

- Run from a local web server if you encounter CORS issues with content.json
- For best effect, use short, impactful phrases
- The presentation loops automatically
- Particles are colored with cyan/blue tint for a space feel
- Background stars add depth and motion

## Customization Ideas

You can modify `presentation.js` to adjust:
- `PARTICLE_COUNT` - More particles = denser text
- `smoothing` in updateParticles - Animation speed
- Font size in textToParticles - Text size
- Camera zoom distance and rotation
- Particle colors and sizes
- Animation timings

Enjoy your cosmic presentation! 🌌
