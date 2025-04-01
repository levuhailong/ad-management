// Xử lý bộ đếm số lượt truy cập
let visitorCount = localStorage.getItem('visitorCount') || 0;
visitorCount = parseInt(visitorCount) + 1;
localStorage.setItem('visitorCount', visitorCount);
document.getElementById('visitorCount').textContent = visitorCount;

// Xử lý đóng/mở thanh bên
const sidebarToggle = document.querySelector('.sidebar-toggle');
const infoSidebar = document.querySelector('.info-sidebar');
const mainContent = document.querySelector('main');

sidebarToggle.addEventListener('click', () => {
    infoSidebar.classList.toggle('hidden');
    mainContent.classList.toggle('sidebar-hidden');
    sidebarToggle.classList.toggle('active');
});

// Tải danh sách quảng cáo khi trang được tải
window.addEventListener('load', loadAds);

// Xử lý tải lên và xem trước hình ảnh
const imageInput = document.getElementById('image');
const form = document.querySelector('.post-form');
let imagePreviewContainer = null;

imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    
    // Kiểm tra nếu đã chọn file
    if (!file) return;
    
    // Kiểm tra định dạng file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert('Vui lòng chọn file hình ảnh có định dạng: JPG, PNG, GIF hoặc WebP');
        imageInput.value = '';
        return;
    }
    
    // Kiểm tra kích thước file (tối đa 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB');
        imageInput.value = '';
        return;
    }

    // Xóa preview cũ nếu có
    if (imagePreviewContainer) {
        imagePreviewContainer.remove();
    }

    // Tạo container cho preview
    imagePreviewContainer = document.createElement('div');
    imagePreviewContainer.className = 'image-preview';
    imagePreviewContainer.style.cssText = `
        margin: 1rem 0;
        max-width: 100%;
        border-radius: 10px;
        overflow: hidden;
        position: relative;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;

    // Tạo preview hình ảnh
    const img = document.createElement('img');
    img.style.cssText = `
        max-width: 100%;
        height: auto;
        display: block;
    `;

    // Tạo nút xóa
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-image';
    removeButton.innerHTML = '<i class="fas fa-times"></i>';
    removeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(255,255,255,0.9);
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;

    // Thêm sự kiện xóa ảnh
    removeButton.addEventListener('click', function() {
        imagePreviewContainer.remove();
        imageInput.value = '';
        imagePreviewContainer = null;
    });

    // Đọc và hiển thị ảnh
    const reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Thêm các phần tử vào container
    imagePreviewContainer.appendChild(img);
    imagePreviewContainer.appendChild(removeButton);

    // Thêm container vào form
    imageInput.parentNode.insertBefore(imagePreviewContainer, imageInput.nextSibling);
});

// Xử lý submit form
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Kiểm tra xem đã chọn ảnh chưa
    if (!imageInput.files || !imageInput.files[0]) {
        alert('Vui lòng chọn hình ảnh cho quảng cáo');
        return;
    }

    try {
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        submitBtn.disabled = true;

        const formData = new FormData(this);
        
        const response = await fetch('/api/ads', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi đăng quảng cáo');
        }

        const ad = await response.json();
        
        // Tạo và thêm card mới
        const adCard = createAdCard(ad);
        adCard.style.opacity = '0';
        adCard.style.transform = 'translateY(20px)';
        
        const postSection = document.querySelector('.post-section');
        const firstCard = postSection.querySelector('.ad-card');
        if (firstCard) {
            postSection.insertBefore(adCard, firstCard);
        } else {
            postSection.appendChild(adCard);
        }

        setTimeout(() => {
            adCard.style.opacity = '1';
            adCard.style.transform = 'translateY(0)';
        }, 100);

        alert('Đăng quảng cáo thành công!');
        
        this.reset();
        if (imagePreviewContainer) {
            imagePreviewContainer.remove();
            imagePreviewContainer = null;
        }
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Có lỗi xảy ra khi đăng quảng cáo. Vui lòng thử lại.');
    } finally {
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add active class to navigation links on scroll
window.addEventListener('scroll', function() {
    let sections = document.querySelectorAll('section');
    let navLinks = document.querySelectorAll('.nav-links a');
    
    sections.forEach(section => {
        let top = section.offsetTop - 100;
        let bottom = top + section.offsetHeight;
        let scroll = window.scrollY;
        
        if (scroll >= top && scroll < bottom) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (section.getAttribute('id') === link.getAttribute('href').substring(1)) {
                    link.classList.add('active');
                }
            });
        }
    });
});

// Hiệu ứng fade-in cho các phần tử khi scroll
function fadeInOnScroll() {
    const elements = document.querySelectorAll('.ad-card, .post-section');
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;
        
        if (elementTop < window.innerHeight && elementBottom > 0) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

// Thêm styles ban đầu cho các phần tử
document.querySelectorAll('.ad-card, .post-section').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
});

// Lắng nghe sự kiện scroll
window.addEventListener('scroll', fadeInOnScroll);
fadeInOnScroll(); // Chạy lần đầu khi trang load

// Xử lý bình luận cho các quảng cáo hiện có
document.querySelectorAll('.comment-form').forEach(form => {
    const commentsList = form.nextElementSibling;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const commentText = this.querySelector('textarea').value;
        if (commentText.trim()) {
            addComment(commentsList, {
                author: 'Người dùng',
                text: commentText,
                date: new Date().toLocaleDateString('vi-VN')
            });
            this.reset();
        }
    });
});

// Tải danh sách quảng cáo
async function loadAds() {
    try {
        const response = await fetch('/api/ads');
        if (!response.ok) {
            throw new Error('Lỗi khi tải danh sách quảng cáo');
        }
        const ads = await response.json();
        
        const postSection = document.querySelector('.post-section');
        postSection.innerHTML = '<h2>Danh sách quảng cáo</h2>';
        
        if (ads.length === 0) {
            postSection.innerHTML += '<p class="no-ads">Chưa có quảng cáo nào.</p>';
            return;
        }

        ads.forEach(ad => {
            const adCard = createAdCard(ad);
            postSection.appendChild(adCard);
        });
    } catch (error) {
        console.error('Lỗi:', error);
        const postSection = document.querySelector('.post-section');
        postSection.innerHTML = `
            <h2>Danh sách quảng cáo</h2>
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Có lỗi xảy ra khi tải danh sách quảng cáo. Vui lòng thử lại sau.</p>
                <button onclick="loadAds()" class="retry-btn">
                    <i class="fas fa-sync"></i> Tải lại
                </button>
            </div>
        `;
    }
}

// Xử lý bình luận
function setupCommentHandlers(adCard) {
    const commentTypes = adCard.querySelectorAll('.comment-type');
    const commentForms = adCard.querySelectorAll('.comment-form');
    const commentLists = adCard.querySelectorAll('.comment-list');

    commentTypes.forEach(type => {
        type.addEventListener('click', () => {
            const commentType = type.dataset.type;
            
            // Ẩn tất cả form và danh sách bình luận
            commentForms.forEach(form => form.style.display = 'none');
            commentLists.forEach(list => list.style.display = 'none');
            
            // Hiển thị form và danh sách tương ứng
            const targetForm = adCard.querySelector(`.comment-form[data-type="${commentType}"]`);
            const targetList = adCard.querySelector(`.comment-list[data-type="${commentType}"]`);
            
            if (targetForm) targetForm.style.display = 'block';
            if (targetList) targetList.style.display = 'block';
        });
    });

    commentForms.forEach(form => {
        const textarea = form.querySelector('textarea');
        const submitBtn = form.querySelector('button');
        
        submitBtn.addEventListener('click', async () => {
            const text = textarea.value.trim();
            if (!text) return;
            
            try {
                const response = await fetch(`/api/ads/${adCard.dataset.id}/comment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: form.dataset.type,
                        text: text
                    })
                });

                if (!response.ok) {
                    throw new Error('Lỗi khi thêm bình luận');
                }

                const data = await response.json();
                
                // Cập nhật số lượng bình luận
                const countElement = adCard.querySelector(`.comment-type[data-type="${form.dataset.type}"] .comment-count`);
                if (countElement) {
                    countElement.textContent = parseInt(countElement.textContent) + 1;
                }

                // Thêm bình luận mới vào danh sách
                const commentList = adCard.querySelector(`.comment-list[data-type="${form.dataset.type}"]`);
                if (commentList) {
                    const commentElement = document.createElement('div');
                    commentElement.className = 'comment-item';
                    commentElement.innerHTML = `
                        <p>${text}</p>
                        <span class="comment-date">${new Date().toLocaleString()}</span>
                    `;
                    commentList.appendChild(commentElement);
                }

                // Xóa nội dung textarea
                textarea.value = '';
            } catch (error) {
                console.error('Lỗi:', error);
                alert('Có lỗi xảy ra khi thêm bình luận');
            }
        });
    });
}

// Tạo card quảng cáo
function createAdCard(ad) {
    const template = document.getElementById('ad-template');
    const card = template.content.cloneNode(true).querySelector('.ad-card');
    
    card.dataset.id = ad._id;
    
    const img = card.querySelector('img');
    img.src = ad.imageUrl;
    img.alt = ad.title;
    
    card.querySelector('h3').textContent = ad.title;
    card.querySelector('.business-info').textContent = ad.business;
    card.querySelector('.description').textContent = ad.description;
    card.querySelector('.contact').textContent = ad.contact;
    card.querySelector('.address').textContent = ad.address;
    
    // Định dạng ngày tháng
    const date = new Date(ad.createdAt);
    card.querySelector('.date').textContent = date.toLocaleString();
    
    // Thiết lập xử lý bình luận
    setupCommentHandlers(card);
    
    // Cập nhật số lượng bình luận
    if (ad.comments) {
        const commentTypes = ['question', 'heart', 'idea', 'report'];
        commentTypes.forEach(type => {
            const count = ad.comments.filter(c => c.type === type).length;
            const countElement = card.querySelector(`.comment-type[data-type="${type}"] .comment-count`);
            if (countElement) {
                countElement.textContent = count;
            }
        });

        // Thêm bình luận vào danh sách
        commentTypes.forEach(type => {
            const comments = ad.comments.filter(c => c.type === type);
            const commentList = card.querySelector(`.comment-list[data-type="${type}"]`);
            if (commentList) {
                comments.forEach(comment => {
                    const commentElement = document.createElement('div');
                    commentElement.className = 'comment-item';
                    commentElement.innerHTML = `
                        <p>${comment.text}</p>
                        <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
                    `;
                    commentList.appendChild(commentElement);
                });
            }
        });
    }
    
    return card;
}

// Xóa quảng cáo
async function deleteAd(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa quảng cáo này?')) {
        return;
    }

    try {
        const response = await fetch(`/api/ads/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Lỗi khi xóa quảng cáo');
        }

        const card = document.querySelector(`.ad-card[data-id="${id}"]`);
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => card.remove(), 300);
        }
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Có lỗi xảy ra khi xóa quảng cáo');
    }
} 