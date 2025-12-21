/**
 * Complete profile icons for terpenes, flavors, and effects
 * Each icon has a symbol (SVG path), viewBox, and set category
 */

export const profileIcons = {
  // TERPENES
  myrcene: {
    symbol: `<path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="currentColor"/><path d="M12 8l-2 4h4l-2-4z" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'terpenes',
  },
  limonene: {
    symbol: `<circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 6l2 4-2 4-2-4 2-4z" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'terpenes',
  },
  caryophyllene: {
    symbol: `<path d="M12 8l1 2h-2l1-2z" fill="currentColor"/><path d="M8 12l2-1v2l-2-1zM16 12l-2-1v2l2-1z" fill="currentColor"/><circle cx="12" cy="14" r="2" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'terpenes',
  },
  alpha_pinene: {
    symbol: `<path d="M22.1829 13.9001C20.8726 14.1969 19.1778 14.8185 19.1778 15.0024C19.1778 15.081 19.2334 15.1454 19.3014 15.1454C19.3695 15.1454 20.0463 15.591 20.8056 16.1358C22.2807 17.1938 22.5701 17.2694 23.878 16.9383C24.4366 16.7969 24.661 16.6438 24.7859 16.3193C24.9831 15.8069 24.8852 14.216 24.6416 13.9711C24.359 13.6868 23.2638 13.6553 22.1829 13.9001Z" fill="currentColor"/><path d="M16.6335 21.2647C15.9112 21.8111 15.2996 22.3495 15.2743 22.461C15.2288 22.6622 17.8017 24.2811 18.0215 24.1895C18.3812 24.0393 21.1476 22.3215 21.1476 22.2484C21.1476 22.0943 18.3884 20.2623 18.1632 20.2667C18.0442 20.269 17.3557 20.7182 16.6335 21.2647Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M16.025 8.18531C16.4027 7.57076 16.9928 6.98296 17.3721 6.84348C18.1798 6.54669 19.0149 6.96662 19.5945 7.96098C19.8308 8.36622 19.9847 8.76172 19.9368 8.83964C19.8889 8.91771 19.4437 9.07931 18.9476 9.19915C18.2142 9.37593 17.8638 9.37792 17.0742 9.20938C15.6809 8.9121 15.6167 8.84937 16.025 8.18531ZM13.0673 11.5362C12.8456 11.3254 13.2147 9.65077 13.5357 9.41159C13.8965 9.14253 14.3602 9.21153 15.4844 9.70129L16.3052 10.0588L14.7458 10.8541C13.8881 11.2915 13.1328 11.5984 13.0673 11.5362ZM20.3268 9.72786C20.7331 9.55124 21.1763 9.36669 21.3117 9.31783C21.7026 9.17687 22.1942 9.19502 22.4537 9.36009C22.6943 9.51327 22.9847 11.4748 22.7851 11.5989C22.73 11.6331 21.9882 11.2985 21.1366 10.8551L19.5882 10.0489L20.3268 9.72786ZM13.7484 12.6159C13.8375 12.5262 14.7446 12.0528 15.7643 11.5639C17.2275 10.862 17.7359 10.6922 18.176 10.7577C18.7933 10.8497 22.1325 12.4359 22.1325 12.6372C22.1325 12.707 21.4122 13.0105 20.532 13.3116C19.6518 13.6127 18.7223 13.9422 18.4664 14.0437C18.0809 14.1967 17.8275 14.1629 16.989 13.8459C16.4324 13.6355 15.4391 13.3093 14.7817 13.121C13.9963 12.896 13.642 12.7228 13.7484 12.6159ZM10.9703 15.5111C10.9703 14.389 11.1361 13.9508 11.6269 13.7743C12.2472 13.5515 14.306 13.9308 15.8055 14.5442L16.7482 14.9298L13.7208 17.1643L12.7407 17.0527C11.0212 16.8571 10.9703 16.8129 10.9703 15.5111ZM15.1266 17.7067C15.0327 17.6745 14.9666 17.6518 14.9542 17.6121C14.9247 17.5177 15.1994 17.327 16.1282 16.6822C16.1908 16.6388 16.2563 16.5933 16.3249 16.5456C17.0363 16.0514 17.7661 15.649 17.9467 15.6515C18.2906 15.6561 20.6707 17.2559 20.7674 17.5472C20.8329 17.745 18.5281 18.7768 18.021 18.7768C17.8298 18.7768 17.1809 18.5644 16.579 18.3046C15.9769 18.0449 15.3446 17.7833 15.1737 17.723C15.1574 17.7173 15.1416 17.7119 15.1266 17.7067ZM9.98774 18.9914C9.98594 18.3457 10.0562 18.0931 10.2712 17.9721C10.5872 17.7944 12.1136 17.9132 12.3539 18.1344C12.4795 18.2499 10.6665 20.3829 10.2935 20.5581C10.1299 20.635 9.99004 19.9193 9.98774 18.9914ZM23.6272 18.5778C23.5118 18.4228 23.465 18.2186 23.5233 18.1238C23.5816 18.0291 24.0999 17.9515 24.6754 17.9515C25.5894 17.9515 25.7352 17.9947 25.8296 18.2934C25.9553 18.6922 25.7648 20.5926 25.599 20.5926C25.4826 20.5926 23.9983 19.0759 23.6272 18.5778ZM11.4628 20.9362C11.4628 20.8687 12.0069 20.2829 12.6719 19.6344L13.8812 18.4553L15.3884 18.9637C16.2174 19.2431 16.8735 19.5366 16.8465 19.6155C16.7498 19.8998 14.2137 21.9131 13.9527 21.9131C13.5752 21.9131 11.4628 21.0843 11.4628 20.9362ZM10.087 23.7524C9.82375 22.8515 9.86521 22.3062 10.3125 22.125C10.4263 22.0789 10.6223 22.0915 10.8215 22.0912C11.7597 22.0901 12.7922 22.627 13.1094 22.8241C13.2663 22.9217 11.3569 25.8747 11.1371 25.8747C10.9515 25.8747 10.3549 24.6692 10.087 23.7524ZM23.1943 22.8672C23.1223 22.6782 23.2817 22.547 23.8046 22.3655C26.0625 21.5823 26.3737 22.4425 25.4159 24.6816C25.2129 25.1563 24.9896 25.5446 24.9197 25.5446C24.7928 25.5446 23.3787 23.3503 23.1943 22.8672ZM18.8313 24.9214L20.2767 24.0816C21.0717 23.6196 21.8081 23.2399 21.9133 23.2376C22.3547 23.2284 24.1802 26.304 24.0052 26.7619C23.9662 26.8641 23.4734 27.2661 22.9102 27.6553L21.8862 28.3628L21.3972 27.7378C21.1284 27.394 20.4411 26.6197 19.8698 26.0172L18.8313 24.9214ZM11.8838 26.8994L13.0276 25.1613C13.6566 24.2052 14.2408 23.4175 14.3259 23.4109C14.5317 23.3947 16.6701 24.6767 16.8058 24.8978C16.8646 24.9933 16.4399 25.5677 15.8625 26.1745C15.2848 26.7813 14.644 27.5201 14.4383 27.8161L14.0642 28.3545L13.4508 27.9811C13.1135 27.7759 12.6228 27.4485 12.3607 27.2537L11.8838 26.8994ZM15.0741 28.6703C15.0741 28.5975 15.673 27.9014 16.4051 27.1236C17.1372 26.346 17.8227 25.7096 17.9286 25.7096C18.2612 25.7096 20.6551 28.3266 20.6551 28.6903C20.6551 28.9662 19.3633 29.2414 18.0287 29.2498C16.6811 29.2583 15.0741 28.9431 15.0741 28.6703Z" fill="currentColor"/><path d="M20.8413 18.8589C19.8643 19.2192 19.3516 19.5257 19.5171 19.6502C19.5561 19.6796 20.1733 20.1705 20.8885 20.7408C22.2915 21.8598 22.3843 21.8799 23.6546 21.3423C24.4141 21.0207 24.3713 20.9121 22.924 19.4916L21.8862 18.4733L20.8413 18.8589Z" fill="currentColor"/>`,
    viewBox: '0 0 36 36',
    set: 'terpenes',
  },
  beta_pinene: {
    symbol: `<path d="M12 8l-2 3 2 3 2-3-2-3z" fill="currentColor"/><path d="M12 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/><circle cx="12" cy="10" r="1" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'terpenes',
  },
  linalool: {
    symbol: `<path fill-rule="evenodd" clip-rule="evenodd" d="M18.4144 6.08086C18.4144 6.12519 19.2878 6.34189 19.8564 6.66891C21.048 7.3543 22.2253 8.36119 22.8556 9.90199C23.9978 12.6943 22.9118 16.3759 19.9569 17.1871C18.463 17.5969 17.1364 17.3715 16.9662 16.0337C16.796 14.6959 17.5076 14.4513 18.0227 15.084C18.275 15.6992 19.7036 15.5749 20.3472 14.9188C21.3459 13.9008 20.925 12.2041 19.6642 11.6672C19.0488 11.4051 18.9072 11.4144 18.1167 11.771C16.5896 12.4596 15.7997 14.2161 15.8089 16.9034C15.8146 18.5636 15.9587 18.8447 17.2841 19.7807C17.9101 20.2227 19.2565 21.385 19.9475 21.5717C20.5653 20.6046 22.4194 18.8208 24.8187 16.3682C27.1494 13.9857 26.0937 10.1089 23.7742 7.80681C22.4742 6.51656 20.9983 6 19.4842 6C18.8959 6 18.4144 6.03634 18.4144 6.08086ZM15.2806 6.94952C11.6877 7.61615 10.024 12.7094 11.9498 15.881C12.6505 17.0349 14.3212 18.1519 14.6759 18.1519C14.7562 18.1519 14.3983 16.5857 14.5037 15.5878C14.8088 12.6989 16.3786 9.54458 19.4842 9.18298C19.9811 9.12513 20.02 9.1216 20.7648 9.18298C19.1475 6.7804 16.3868 6.74429 15.2806 6.94952ZM9.54991 12.6891C9.20676 13.2699 8.13199 15.9837 8.02376 18.0709C7.77522 22.8634 9.47744 27.4034 13.1009 29.2105C14.916 30.1155 18.4986 30.5782 19.8564 28.7081C20.2313 28.1919 20.242 28.0565 20.0274 26.5557C19.5506 23.221 18.0483 21.808 14.894 19.9357C11.7397 18.0634 10.7969 16.8476 9.90129 14.1231C9.7214 13.5759 9.61181 12.5845 9.54991 12.6891ZM26.3456 16.0337C25.4522 17.6007 24.2734 18.5299 22.8556 20.2702C21.4378 22.0104 21.1996 23.318 21.1589 25.8053C21.1352 27.253 21.5469 29.3005 21.9831 29.3005C22.4194 29.3005 23.1928 28.8269 23.9462 28.2971C27.5837 25.7392 28.176 21.3797 27.9614 17.4939C27.8566 15.5991 27.4921 13.7863 27.2157 13.7863C27.1266 13.7863 26.8646 15.1235 26.3456 16.0337Z" fill="currentColor"/>`,
    viewBox: '0 0 36 36',
    set: 'terpenes',
  },
  humulene: {
    symbol: `<path d="M11.5624 11.8139C6.21919 17.4913 8.38648 22.5646 10.8083 25.1533C10.8473 25.1128 10.8878 25.0719 10.9296 25.0307C11.0069 24.9525 11.082 24.8733 11.1549 24.793C14.3486 21.2774 13.4092 15.7529 11.5624 11.8139Z" fill="currentColor"/><path d="M24.5822 22.2903C26.255 21.5041 28.125 19.0329 28.125 19.0329C26.3131 19.5612 22.2941 16.3599 19.1725 18.0249C17.4787 18.9283 16.2114 20.7086 15.7972 21.586C17.7694 21.8501 21.4707 23.7529 24.5822 22.2903Z" fill="currentColor"/><path d="M27.2393 8.5385C27.2393 8.5385 26.968 13.7897 24.5822 15.4234C22.899 16.576 20.0947 16.7679 19.4452 16.4199C19.1352 16.0877 19.2529 13.8649 19.888 12.4301C21.1979 9.47081 27.2393 8.5385 27.2393 8.5385Z" fill="currentColor"/><path d="M11.9167 26.164C16.0245 29.3408 21.2438 28.5483 24.5822 24.5793C15.3993 21.586 13.4062 22.7962 11.1735 24.8015C11.0876 24.8787 11.0062 24.9552 10.9296 25.0307L10.8083 25.1533C11.1806 25.5512 11.4531 25.8055 11.9167 26.164Z" fill="currentColor"/><path d="M17.7694 16.7211C19.1725 12.6942 17.238 10.5703 17.7694 7.5C16.5613 7.70128 14.1149 9.16404 13.5995 13.1344C13.3586 14.9903 13.652 17.4825 14.408 20.3535C15.9051 20.0014 17.2727 17.7852 17.7694 16.7211Z" fill="currentColor"/>`,
    viewBox: '0 0 36 36',
    set: 'terpenes',
  },
  terpinolene: {
    symbol: `<path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="currentColor"/><path d="M12 10l-1 2h2l-1-2z" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'terpenes',
  },
  ocimene: {
    symbol: `<path d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/><path d="M8 12l2-1v2l-2-1zM16 12l-2-1v2l2-1z" fill="currentColor"/><circle cx="12" cy="14" r="1.5" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'terpenes',
  },
  bisabolol: {
    symbol: `<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="16" r="1" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'terpenes',
  },
  nerolidol: {
    symbol: `<path d="M10 8h4v6h-4v-6z" fill="currentColor"/><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/><path d="M8 18h8v2H8v-2z" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'terpenes',
  },
  farnesene: {
    symbol: `<circle cx="10" cy="10" r="2" fill="currentColor"/><circle cx="14" cy="10" r="2" fill="currentColor"/><circle cx="12" cy="14" r="2" fill="currentColor"/><path d="M10 10l2 4 2-4" fill="none" stroke="currentColor" stroke-width="1.5"/>`,
    viewBox: '0 0 24 24',
    set: 'terpenes',
  },
  pinene: {
    symbol: `<path d="M22.1829 13.9001C20.8726 14.1969 19.1778 14.8185 19.1778 15.0024C19.1778 15.081 19.2334 15.1454 19.3014 15.1454C19.3695 15.1454 20.0463 15.591 20.8056 16.1358C22.2807 17.1938 22.5701 17.2694 23.878 16.9383C24.4366 16.7969 24.661 16.6438 24.7859 16.3193C24.9831 15.8069 24.8852 14.216 24.6416 13.9711C24.359 13.6868 23.2638 13.6553 22.1829 13.9001Z" fill="currentColor"/><path d="M16.6335 21.2647C15.9112 21.8111 15.2996 22.3495 15.2743 22.461C15.2288 22.6622 17.8017 24.2811 18.0215 24.1895C18.3812 24.0393 21.1476 22.3215 21.1476 22.2484C21.1476 22.0943 18.3884 20.2623 18.1632 20.2667C18.0442 20.269 17.3557 20.7182 16.6335 21.2647Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M16.025 8.18531C16.4027 7.57076 16.9928 6.98296 17.3721 6.84348C18.1798 6.54669 19.0149 6.96662 19.5945 7.96098C19.8308 8.36622 19.9847 8.76172 19.9368 8.83964C19.8889 8.91771 19.4437 9.07931 18.9476 9.19915C18.2142 9.37593 17.8638 9.37792 17.0742 9.20938C15.6809 8.9121 15.6167 8.84937 16.025 8.18531ZM13.0673 11.5362C12.8456 11.3254 13.2147 9.65077 13.5357 9.41159C13.8965 9.14253 14.3602 9.21153 15.4844 9.70129L16.3052 10.0588L14.7458 10.8541C13.8881 11.2915 13.1328 11.5984 13.0673 11.5362ZM20.3268 9.72786C20.7331 9.55124 21.1763 9.36669 21.3117 9.31783C21.7026 9.17687 22.1942 9.19502 22.4537 9.36009C22.6943 9.51327 22.9847 11.4748 22.7851 11.5989C22.73 11.6331 21.9882 11.2985 21.1366 10.8551L19.5882 10.0489L20.3268 9.72786ZM13.7484 12.6159C13.8375 12.5262 14.7446 12.0528 15.7643 11.5639C17.2275 10.862 17.7359 10.6922 18.176 10.7577C18.7933 10.8497 22.1325 12.4359 22.1325 12.6372C22.1325 12.707 21.4122 13.0105 20.532 13.3116C19.6518 13.6127 18.7223 13.9422 18.4664 14.0437C18.0809 14.1967 17.8275 14.1629 16.989 13.8459C16.4324 13.6355 15.4391 13.3093 14.7817 13.121C13.9963 12.896 13.642 12.7228 13.7484 12.6159ZM10.9703 15.5111C10.9703 14.389 11.1361 13.9508 11.6269 13.7743C12.2472 13.5515 14.306 13.9308 15.8055 14.5442L16.7482 14.9298L13.7208 17.1643L12.7407 17.0527C11.0212 16.8571 10.9703 16.8129 10.9703 15.5111ZM15.1266 17.7067C15.0327 17.6745 14.9666 17.6518 14.9542 17.6121C14.9247 17.5177 15.1994 17.327 16.1282 16.6822C16.1908 16.6388 16.2563 16.5933 16.3249 16.5456C17.0363 16.0514 17.7661 15.649 17.9467 15.6515C18.2906 15.6561 20.6707 17.2559 20.7674 17.5472C20.8329 17.745 18.5281 18.7768 18.021 18.7768C17.8298 18.7768 17.1809 18.5644 16.579 18.3046C15.9769 18.0449 15.3446 17.7833 15.1737 17.723C15.1574 17.7173 15.1416 17.7119 15.1266 17.7067ZM9.98774 18.9914C9.98594 18.3457 10.0562 18.0931 10.2712 17.9721C10.5872 17.7944 12.1136 17.9132 12.3539 18.1344C12.4795 18.2499 10.6665 20.3829 10.2935 20.5581C10.1299 20.635 9.99004 19.9193 9.98774 18.9914ZM23.6272 18.5778C23.5118 18.4228 23.465 18.2186 23.5233 18.1238C23.5816 18.0291 24.0999 17.9515 24.6754 17.9515C25.5894 17.9515 25.7352 17.9947 25.8296 18.2934C25.9553 18.6922 25.7648 20.5926 25.599 20.5926C25.4826 20.5926 23.9983 19.0759 23.6272 18.5778ZM11.4628 20.9362C11.4628 20.8687 12.0069 20.2829 12.6719 19.6344L13.8812 18.4553L15.3884 18.9637C16.2174 19.2431 16.8735 19.5366 16.8465 19.6155C16.7498 19.8998 14.2137 21.9131 13.9527 21.9131C13.5752 21.9131 11.4628 21.0843 11.4628 20.9362ZM10.087 23.7524C9.82375 22.8515 9.86521 22.3062 10.3125 22.125C10.4263 22.0789 10.6223 22.0915 10.8215 22.0912C11.7597 22.0901 12.7922 22.627 13.1094 22.8241C13.2663 22.9217 11.3569 25.8747 11.1371 25.8747C10.9515 25.8747 10.3549 24.6692 10.087 23.7524ZM23.1943 22.8672C23.1223 22.6782 23.2817 22.547 23.8046 22.3655C26.0625 21.5823 26.3737 22.4425 25.4159 24.6816C25.2129 25.1563 24.9896 25.5446 24.9197 25.5446C24.7928 25.5446 23.3787 23.3503 23.1943 22.8672ZM18.8313 24.9214L20.2767 24.0816C21.0717 23.6196 21.8081 23.2399 21.9133 23.2376C22.3547 23.2284 24.1802 26.304 24.0052 26.7619C23.9662 26.8641 23.4734 27.2661 22.9102 27.6553L21.8862 28.3628L21.3972 27.7378C21.1284 27.394 20.4411 26.6197 19.8698 26.0172L18.8313 24.9214ZM11.8838 26.8994L13.0276 25.1613C13.6566 24.2052 14.2408 23.4175 14.3259 23.4109C14.5317 23.3947 16.6701 24.6767 16.8058 24.8978C16.8646 24.9933 16.4399 25.5677 15.8625 26.1745C15.2848 26.7813 14.644 27.5201 14.4383 27.8161L14.0642 28.3545L13.4508 27.9811C13.1135 27.7759 12.6228 27.4485 12.3607 27.2537L11.8838 26.8994ZM15.0741 28.6703C15.0741 28.5975 15.673 27.9014 16.4051 27.1236C17.1372 26.346 17.8227 25.7096 17.9286 25.7096C18.2612 25.7096 20.6551 28.3266 20.6551 28.6903C20.6551 28.9662 19.3633 29.2414 18.0287 29.2498C16.6811 29.2583 15.0741 28.9431 15.0741 28.6703Z" fill="currentColor"/><path d="M20.8413 18.8589C19.8643 19.2192 19.3516 19.5257 19.5171 19.6502C19.5561 19.6796 20.1733 20.1705 20.8885 20.7408C22.2915 21.8598 22.3843 21.8799 23.6546 21.3423C24.4141 21.0207 24.3713 20.9121 22.924 19.4916L21.8862 18.4733L20.8413 18.8589Z" fill="currentColor"/>`,
    viewBox: '0 0 36 36',
    set: 'terpenes',
  },

  // FLAVORS
  berry: {
    symbol: `<circle cx="12" cy="12" r="4" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  floral: {
    symbol: `<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  tropical: {
    symbol: `<path d="M12 6l-3 6 3 6 3-6-3-6z" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  sweet_floral: {
    symbol: `<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/><path d="M12 10v4M10 12h4" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  chamomile: {
    symbol: `<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="16" r="1" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  spicy: {
    symbol: `<path d="M12 8l1 2h-2l1-2z" fill="currentColor"/><path d="M8 12l2-1v2l-2-1zM16 12l-2-1v2l2-1z" fill="currentColor"/><circle cx="12" cy="14" r="2" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  creamy: {
    symbol: `<path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  mint: {
    symbol: `<path d="M12 6l-2 4h4l-2-4z" fill="currentColor"/><path d="M12 10v6M10 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  herbal_fresh: {
    symbol: `<path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="currentColor"/><path d="M12 10l-1 2h2l-1-2z" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  green_leaf: {
    symbol: `<path d="M12 8l-2 4 2 4 2-4-2-4z" fill="currentColor"/><path d="M12 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  floral_petals: {
    symbol: `<circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="16" r="1" fill="currentColor"/><circle cx="8" cy="12" r="1" fill="currentColor"/><circle cx="16" cy="12" r="1" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  herbal: {
    symbol: `<path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="currentColor"/><path d="M12 8l-2 4h4l-2-4z" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  citrus: {
    symbol: `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M21.66 17.67a1.08 1.08 0 0 1-.04 1.6A12 12 0 0 1 4.73 2.38a1.1 1.1 0 0 1 1.61-.04z"></path><path d="M19.65 15.66A8 8 0 0 1 8.35 4.34M14 10l-5.5 5.5"></path><path d="M14 17.85V10H6.15"></path></g>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  candy_sweet: {
    symbol: `<circle cx="12" cy="12" r="4" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="1"/><path d="M12 10v4M10 12h4" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  balanced_leaf: {
    symbol: `<path d="M12 8l-2 4 2 4 2-4-2-4z" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  woody: {
    symbol: `<path d="M10 8h4v8h-4v-8z" fill="currentColor"/><path d="M12 10v4" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  pinecone_woody: {
    symbol: `<path d="M12 8l-2 3 2 3 2-3-2-3z" fill="currentColor"/><path d="M12 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/><circle cx="12" cy="10" r="1" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  pine: {
    symbol: `<path d="M12 6l-3 6 3 6 3-6-3-6z" fill="currentColor"/><path d="M12 14l-2 4 2 4 2-4-2-4z" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  fresh_herb: {
    symbol: `<path d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/><path d="M12 10l-1 2h2l-1-2z" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  hops: {
    symbol: `<path fill-rule="evenodd" clip-rule="evenodd" d="M17.6997 7.70878C17.0936 7.94079 16.9349 7.93748 16.1472 7.67561C14.5376 7.14033 12.5575 7.41857 11.684 8.98372C11.4216 9.45403 11.4938 9.57288 11.2733 9.89484C10.7382 10.676 9.63581 10.2867 9.18022 11.1169C8.75391 11.8937 9.23089 12.5015 9.18022 13.3864C9.12922 14.2771 8.50514 15.111 9.00581 16.005C9.44004 16.7804 10.3284 16.43 10.9244 17.2271C11.2714 17.691 11.1968 18.1431 11.6221 18.5364C12.549 19.3935 13.4851 18.2622 14.7428 18.3655C15.6746 18.442 16.0015 18.8318 17.1163 18.8318C18.2312 18.8318 18.9695 18.3655 18.9695 18.3655C18.9695 18.3655 19.8331 17.9335 20.6919 18.4491C21.2041 18.7211 21.2835 19.0598 22.33 19.181C23.4673 19.3127 25.0335 18.0462 25.0335 18.0462C25.0335 18.0462 26.2734 18.2442 26.8838 17.2271C27.9115 15.5149 25.9768 14.9912 26.2734 13.2118C26.3128 12.3415 26.4926 11.7207 25.9768 11.0359C25.4508 10.3374 24.8527 10.3175 23.9187 10.1567C23.4268 10.0719 23.0937 9.63663 22.6991 9.19321C22.2832 8.72567 22.0616 8.18011 21.5666 7.78786C21.1632 7.46821 20.7819 7.3502 20.05 7.31913C19.1808 7.28186 18.5055 7.40043 17.6997 7.70878ZM14.8489 20.0537C15.6149 20.8727 16.1366 21.4333 16.5931 22.2898C16.9278 22.9179 17.1162 23.7784 17.1163 25.2576C17.1165 27.0725 16.7778 27.8775 16.157 28.2254C15.6807 28.4922 16.2711 28.5773 16.487 28.6081C18.3184 28.87 18.0689 28.3968 19.0161 28.4336C19.181 28.44 20.6038 28.6171 20.237 28.4336C20.0626 28.3463 19.8356 28.2653 19.6265 28.0871C19.0161 27.2143 19.0502 26.4988 19.0349 25.6068C19.0103 24.1607 19.1555 22.9217 19.801 21.6278C20.3053 20.6167 21.3919 20.3164 20.9481 19.6596C20.4698 18.9518 19.0349 20.7186 19.0349 20.7186C19.0349 20.7186 19.1905 19.6174 18.9289 19.4429C18.9289 19.3557 18.5227 19.5491 18.3184 19.6173C18.114 19.6854 17.8955 19.6464 17.7951 19.7918C17.4429 20.3026 17.6438 21.155 17.2907 21.155C16.6039 21.155 15.8765 19.312 14.8489 19.2347C14.1323 19.1808 14.5684 19.8253 14.8489 20.0537Z" fill="currentColor"/>`,
    viewBox: '0 0 36 36',
    set: 'flavors',
  },
  lavender: {
    symbol: `<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/><path d="M12 10v4" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  rose: {
    symbol: `<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  stone_fruit: {
    symbol: `<circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 10v4M10 12h4" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  tea: {
    symbol: `<path d="M10 8h4v6h-4v-6z" fill="currentColor"/><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/><path d="M8 18h8v2H8v-2z" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  sweet_flower: {
    symbol: `<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/><path d="M12 10v4M10 12h4" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  fresh_leaf: {
    symbol: `<path d="M12 8l-2 4 2 4 2-4-2-4z" fill="currentColor"/><path d="M12 10l-1 2h2l-1-2z" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  floral_cluster: {
    symbol: `<circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="16" r="1" fill="currentColor"/><circle cx="8" cy="12" r="1" fill="currentColor"/><circle cx="16" cy="12" r="1" fill="currentColor"/><circle cx="10" cy="10" r="0.8" fill="currentColor"/><circle cx="14" cy="10" r="0.8" fill="currentColor"/><circle cx="10" cy="14" r="0.8" fill="currentColor"/><circle cx="14" cy="14" r="0.8" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  green_leaf_fresh: {
    symbol: `<path d="M12 8l-2 4 2 4 2-4-2-4z" fill="currentColor"/><path d="M12 10l-1 2h2l-1-2z" fill="currentColor"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  pinecone: {
    symbol: `<path d="M12 8l-2 3 2 3 2-3-2-3z" fill="currentColor"/><path d="M12 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/><circle cx="12" cy="10" r="1" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },
  evergreen: {
    symbol: `<path d="M12 6l-3 6 3 6 3-6-3-6z" fill="currentColor"/><path d="M12 14l-2 4 2 4 2-4-2-4z" fill="currentColor"/><path d="M12 10l-1 2h2l-1-2z" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'flavors',
  },

  // EFFECTS
  energetic: {
    symbol: `<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  creative: {
    symbol: `<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  focused: {
    symbol: `<path d="M12 6l-2 4h4l-2-4z" fill="currentColor"/><path d="M12 10v6M10 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  relaxed: {
    symbol: `<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/><path d="M12 10v4" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  sedated: {
    symbol: `<path d="M10 8h4v8h-4v-8z" fill="currentColor"/><path d="M12 10v4" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  comforted: {
    symbol: `<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/><path d="M12 10v4M10 12h4" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  social: {
    symbol: `<path d="M12 6l-3 6 3 6 3-6-3-6z" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  bright: {
    symbol: `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M21.66 17.67a1.08 1.08 0 0 1-.04 1.6A12 12 0 0 1 4.73 2.38a1.1 1.1 0 0 1 1.61-.04z"></path><path d="M19.65 15.66A8 8 0 0 1 8.35 4.34M14 10l-5.5 5.5"></path><path d="M14 17.85V10H6.15"></path></g>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  balanced: {
    symbol: `<path d="M12 8l-2 4 2 4 2-4-2-4z" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  relaxing: {
    symbol: `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10c2.483 0 4.345-3 4.345-3s1.862 3 4.345 3s4.965-3 4.965-3s2.483 3 4.345 3M3 17c2.483 0 4.345-3 4.345-3s1.862 3 4.345 3s4.965-3 4.965-3s2.483 3 4.345 3"></path>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  body_high: {
    symbol: `<path d="M10 8h4v8h-4v-8z" fill="currentColor"/><path d="M12 10v4" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  sleepy: {
    symbol: `<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="16" r="1" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  euphoric: {
    symbol: `<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/><path d="M12 10v4M10 12h4" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  expansive: {
    symbol: `<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  blissful: {
    symbol: `<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/><path d="M12 10v4M10 12h4" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  heavy: {
    symbol: `<path d="M10 8h4v8h-4v-8z" fill="currentColor"/><path d="M12 10v4" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  dreamy: {
    symbol: `<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/><path d="M12 10v4" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  chatty: {
    symbol: `<circle cx="12" cy="12" r="4" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  warm: {
    symbol: `<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/><path d="M12 10v4M10 12h4" stroke="currentColor" stroke-width="1"/>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
  uplifted: {
    symbol: `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M21.66 17.67a1.08 1.08 0 0 1-.04 1.6A12 12 0 0 1 4.73 2.38a1.1 1.1 0 0 1 1.61-.04z"></path><path d="M19.65 15.66A8 8 0 0 1 8.35 4.34M14 10l-5.5 5.5"></path><path d="M14 17.85V10H6.15"></path></g>`,
    viewBox: '0 0 24 24',
    set: 'effects',
  },
} as const
