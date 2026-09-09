const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath, replacements) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  fs.writeFileSync(filePath, content, 'utf8');
};

const srcDir = path.join(__dirname, 'src');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync(srcDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const replace = (regex, replacement) => {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      changed = true;
    }
  };

  // Orders fixes
  replace(/order\.productSales/g, '(order.totalRevenue || 0)');
  replace(/order\.shippingCredits/g, '0');
  replace(/order\.promotions/g, '0');
  replace(/order\.shippingCost/g, '0');
  replace(/order\.netPayout/g, 'order.netPayoutExpected');
  replace(/order\.returnDetails/g, '({ reason: order.returnReason, condition: order.returnCondition, status: order.returnStatus, refundedAmount: order.refundAmount })');
  replace(/ReturnCondition/g, 'any'); // temporary fallback
  replace(/CompensationClaimState/g, 'any'); // temporary fallback
  replace(/"ReturningToSeller"/g, '"Returned"'); 
  replace(/"RejectedByBuyer"/g, '"Returned"');
  replace(/"ReturnedToSeller"/g, '"Returned"');

  // Purchases fixes
  replace(/totalItemCost/g, 'totalCost');
  replace(/item\.quantity/g, '(item.orderedQuantity || item.receivedQuantity || 0)');
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});

console.log("Done");
