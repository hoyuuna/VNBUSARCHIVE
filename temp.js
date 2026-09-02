const fs = require('fs');

function restoreOnboarding(file) {
    let css = fs.readFileSync(file, 'utf8');
    
    // Remove it from the solid background list
    css = css.replace(/#onboarding-content,\s*/g, '');
    
    // Add specific glassmorphism rule for onboarding-content
    const glassRule = `
/* GIỮ NGUYÊN GLASSMORPHISM CHO ONBOARDING */
#onboarding-content {
    background-color: rgba(255, 255, 255, 0.7) !important;
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(255, 255, 255, 0.6) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
}
`;
    if (!css.includes('#onboarding-content {')) {
        css += glassRule;
    }
    
    fs.writeFileSync(file, css);
}

restoreOnboarding('public/css/light.css');

// For dark mode, use a dark glassmorphism
function restoreOnboardingDark(file) {
    let css = fs.readFileSync(file, 'utf8');
    
    css = css.replace(/#onboarding-content,\s*/g, '');
    
    const glassRule = `
/* GIỮ NGUYÊN GLASSMORPHISM CHO ONBOARDING (DARK) */
#onboarding-content {
    background-color: rgba(24, 24, 27, 0.7) !important; /* Zinc-900 /70 */
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(63, 63, 70, 0.6) !important; /* Zinc-700 /60 */
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
}
`;
    if (!css.includes('#onboarding-content {')) {
        css += glassRule;
    }
    
    fs.writeFileSync(file, css);
}

restoreOnboardingDark('public/css/dark.css');

console.log('Restored glassmorphism to onboarding-content.');
