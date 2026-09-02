const fs = require('fs');

function revertOnboarding(file) {
    let css = fs.readFileSync(file, 'utf8');
    
    // Remove the glassmorphism block
    css = css.replace(/\/\* GIỮ NGUYÊN GLASSMORPHISM CHO ONBOARDING \(\w+\) \*\/\r?\n#onboarding-content \{[\s\S]*?\}\r?\n/g, '');
    css = css.replace(/\/\* GIỮ NGUYÊN GLASSMORPHISM CHO ONBOARDING \*\/\r?\n#onboarding-content \{[\s\S]*?\}\r?\n/g, '');
    
    // Add #onboarding-content back to the solid background list
    if (!css.includes('#onboarding-content,')) {
        css = css.replace(/#subrole-prompt-content, /g, '#subrole-prompt-content, #onboarding-content, ');
    }
    
    fs.writeFileSync(file, css);
}

revertOnboarding('public/css/light.css');
revertOnboarding('public/css/dark.css');

console.log('Reverted onboarding content to solid white/black.');
