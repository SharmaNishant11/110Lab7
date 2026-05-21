describe('Basic user flow for Website', () => {
  // First, visit the lab 7 website
  beforeAll(async () => {
    await page.goto('https://cse110-sp25.github.io/CSE110-Shop/');
  });

  // Check to make sure that all 20 <product-item> elements have loaded
  it('Initial Home Page - Check for 20 product items', async () => {
    console.log('Checking for 20 product items...');

    const numProducts = await page.$$eval('product-item', (prodItems) => {
      return prodItems.length;
    });

    expect(numProducts).toBe(20);
  });

  // Check to make sure that all 20 <product-item> elements have data in them
  it('Make sure <product-item> elements are populated', async () => {
    console.log('Checking to make sure <product-item> elements are populated...');

    let allArePopulated = true;

    const prodItemsData = await page.$$eval('product-item', prodItems => {
      return prodItems.map(item => item.data);
    });

    // STEP 1: loop over every item, use String() so price doesn't crash if it's a number
    for (let i = 0; i < prodItemsData.length; i++) {
      console.log(`Checking product item ${i + 1}/${prodItemsData.length}`);
      if (String(prodItemsData[i].title).length === 0) { allArePopulated = false; }
      if (String(prodItemsData[i].price).length === 0) { allArePopulated = false; }
      if (String(prodItemsData[i].image).length === 0) { allArePopulated = false; }
    }

    expect(allArePopulated).toBe(true);
  }, 10000);

  // Check that clicking "Add to Cart" on the first item swaps the button text
  it('Clicking the "Add to Cart" button should change button text', async () => {
    console.log('Checking the "Add to Cart" button...');

    // STEP 2: drill into shadow DOM of first item, click, check text
    const firstItem = await page.$('product-item');
    const shadowRoot = await firstItem.getProperty('shadowRoot');
    const button = await shadowRoot.$('button');

    await button.click();

    const innerText = await button.getProperty('innerText');
    const text = await innerText.jsonValue();

    expect(text).toBe('Remove from Cart');
  }, 2500);

  // Check that after clicking "Add to Cart" on every item the cart count is 20
  it('Checking number of items in cart on screen', async () => {
    console.log('Checking number of items in cart on screen...');

    // STEP 3: click all buttons inside the browser in one $$eval call — much faster than
    // round-tripping per item, avoids the 10s timeout
    await page.$$eval('product-item', prodItems => {
      prodItems.forEach(item => {
        const button = item.shadowRoot.querySelector('button');
        // only click if not already in cart (item 0 was clicked in step 2)
        if (button.innerText === 'Add to Cart') {
          button.click();
        }
      });
    });

    const cartCount = await page.$eval('#cart-count', el => el.innerText);
    expect(cartCount).toBe('20');
  }, 10000);

  // Check that after reload the cart is remembered
  it('Checking number of items in cart on screen after reload', async () => {
    console.log('Checking number of items in cart on screen after reload...');

    // STEP 4: reload, then check all buttons and cart count in one $$eval pass
    await page.reload();

    const allRemove = await page.$$eval('product-item', prodItems => {
      return prodItems.every(item => {
        const button = item.shadowRoot.querySelector('button');
        return button.innerText === 'Remove from Cart';
      });
    });

    expect(allRemove).toBe(true);

    const cartCount = await page.$eval('#cart-count', el => el.innerText);
    expect(cartCount).toBe('20');
  }, 10000);

  // Check localStorage contains all 20 IDs
  it('Checking the localStorage to make sure cart is correct', async () => {

    // STEP 5: page.evaluate runs in the browser context where localStorage exists
    const cart = await page.evaluate(() => localStorage.getItem('cart'));
    expect(cart).toBe('[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]');

  });

  // Check that removing all items brings the cart count to 0
  it('Checking number of items in cart on screen after removing from cart', async () => {
    console.log('Checking number of items in cart on screen...');

    // STEP 6: click all "Remove from Cart" buttons in one browser-side pass
    await page.$$eval('product-item', prodItems => {
      prodItems.forEach(item => {
        item.shadowRoot.querySelector('button').click();
      });
    });

    const cartCount = await page.$eval('#cart-count', el => el.innerText);
    expect(cartCount).toBe('0');
  }, 10000);

  // Check that after reload the empty cart is remembered
  it('Checking number of items in cart on screen after reload', async () => {
    console.log('Checking number of items in cart on screen after reload...');

    // STEP 7: reload, then check all buttons say "Add to Cart" and count is 0
    await page.reload();

    const allAdd = await page.$$eval('product-item', prodItems => {
      return prodItems.every(item => {
        const button = item.shadowRoot.querySelector('button');
        return button.innerText === 'Add to Cart';
      });
    });

    expect(allAdd).toBe(true);

    const cartCount = await page.$eval('#cart-count', el => el.innerText);
    expect(cartCount).toBe('0');
  }, 10000);

  // Check localStorage reflects the empty cart
  it('Checking the localStorage to make sure cart is correct', async () => {
    console.log('Checking the localStorage...');

    // STEP 8: cart should now be an empty array
    const cart = await page.evaluate(() => localStorage.getItem('cart'));
    expect(cart).toBe('[]');

  });
});