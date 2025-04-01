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
        
        const response = await fetch('http://localhost:3001/api/ads', {
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

// Tải danh sách quảng cáo khi trang được load
async function loadAds() {
    try {
        const response = await fetch('http://localhost:3001/api/ads');
        
        if (!response.ok) {
            throw new Error('Không thể tải danh sách quảng cáo');
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
        console.error('Lỗi khi tải danh sách quảng cáo:', error);
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

// Xử lý hiển thị form bình luận
function setupCommentHandlers(adCard) {
    const commentTypes = adCard.querySelectorAll('.comment-type');
    const commentForms = adCard.querySelector('.comment-forms');
    const commentLists = adCard.querySelectorAll('.comment-list');

    commentTypes.forEach(type => {
        type.addEventListener('click', () => {
            const commentType = type.dataset.type;
            
            // Hiển thị form bình luận
            commentForms.style.display = 'block';
            adCard.querySelectorAll('.comment-form').forEach(form => {
                form.classList.remove('active');
            });
            adCard.querySelector(`.comment-form[data-type="${commentType}"]`).classList.add('active');

            // Hiển thị danh sách bình luận
            commentLists.forEach(list => list.classList.remove('active'));
            adCard.querySelector(`.comment-list[data-type="${commentType}"]`).classList.add('active');
        });
    });

    // Xử lý submit bình luận
    adCard.querySelectorAll('.comment-form').forEach(form => {
        const submitBtn = form.querySelector('button');
        const textarea = form.querySelector('textarea');
        const commentType = form.dataset.type;

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
                        type: commentType,
                        text: text
                    })
                });

                if (!response.ok) {
                    throw new Error('Lỗi khi đăng bình luận');
                }

                const comment = await response.json();
                
                // Thêm bình luận vào danh sách
                const commentList = adCard.querySelector(`.comment-list[data-type="${commentType}"]`);
                const commentElement = document.createElement('div');
                commentElement.className = 'comment-item';
                commentElement.innerHTML = `
                    <div class="comment-text">${text}</div>
                    <div class="comment-time">${new Date(comment.createdAt).toLocaleString()}</div>
                `;
                commentList.appendChild(commentElement);

                // Cập nhật số lượng bình luận
                const countElement = adCard.querySelector(`.comment-type[data-type="${commentType}"] .comment-count`);
                countElement.textContent = parseInt(countElement.textContent) + 1;

                // Reset form
                textarea.value = '';
            } catch (error) {
                console.error('Lỗi:', error);
                alert('Có lỗi xảy ra khi đăng bình luận');
            }
        });
    });
}

// Tạo card quảng cáo
function createAdCard(ad) {
    const template = document.querySelector('#ad-template');
    const card = template.content.cloneNode(true).children[0];
    
    card.className = 'ad-card';
    card.dataset.id = ad._id;
    
    card.innerHTML = `
        <div class="ad-image">
            <img src="${ad.imageUrl}" alt="${ad.title}">
        </div>
        <div class="ad-content">
            <h3>${ad.title}</h3>
            <div class="business-info">
                <strong>${ad.business}</strong>
            </div>
            <p>${ad.description}</p>
            <div class="ad-meta">
                <span><i class="fas fa-phone"></i> ${ad.contact}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${ad.address}</span>
                <span><i class="fas fa-clock"></i> ${new Date(ad.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
            <div class="comment-section">
                <div class="comment-types">
                    <button class="comment-type" data-type="question">
                        <i class="fas fa-question-circle" style="color: #3498db;"></i>
                        <span class="comment-count">${ad.comments?.questions?.length || 0}</span>
                    </button>
                    <button class="comment-type" data-type="heart">
                        <i class="fas fa-heart" style="color: #e74c3c;"></i>
                        <span class="comment-count">${ad.comments?.hearts?.length || 0}</span>
                    </button>
                    <button class="comment-type" data-type="idea">
                        <i class="fas fa-lightbulb" style="color: #f1c40f;"></i>
                        <span class="comment-count">${ad.comments?.ideas?.length || 0}</span>
                    </button>
                    <button class="comment-type" data-type="report">
                        <i class="fas fa-trash-alt" style="color: #95a5a6;"></i>
                        <span class="comment-count">${ad.comments?.reports?.length || 0}</span>
                    </button>
                </div>
                <div class="comment-forms" style="display: none;">
                    <form class="comment-form" data-type="question">
                        <textarea placeholder="Đặt câu hỏi của bạn..."></textarea>
                        <button type="button">Gửi</button>
                    </form>
                    <form class="comment-form" data-type="heart">
                        <textarea placeholder="Chia sẻ cảm nhận của bạn..."></textarea>
                        <button type="button">Gửi</button>
                    </form>
                    <form class="comment-form" data-type="idea">
                        <textarea placeholder="Đóng góp ý kiến của bạn..."></textarea>
                        <button type="button">Gửi</button>
                    </form>
                    <form class="comment-form" data-type="report">
                        <textarea placeholder="Báo cáo vấn đề..."></textarea>
                        <button type="button">Gửi</button>
                    </form>
                </div>
                <div class="comment-lists">
                    <div class="comment-list" data-type="question">
                        ${ad.comments?.questions?.map(comment => `
                            <div class="comment-item">
                                <div class="comment-text">${comment.text}</div>
                                <div class="comment-time">${new Date(comment.createdAt).toLocaleString()}</div>
                            </div>
                        `).join('') || ''}
                    </div>
                    <div class="comment-list" data-type="heart">
                        ${ad.comments?.hearts?.map(comment => `
                            <div class="comment-item">
                                <div class="comment-text">${comment.text}</div>
                                <div class="comment-time">${new Date(comment.createdAt).toLocaleString()}</div>
                            </div>
                        `).join('') || ''}
                    </div>
                    <div class="comment-list" data-type="idea">
                        ${ad.comments?.ideas?.map(comment => `
                            <div class="comment-item">
                                <div class="comment-text">${comment.text}</div>
                                <div class="comment-time">${new Date(comment.createdAt).toLocaleString()}</div>
                            </div>
                        `).join('') || ''}
                    </div>
                    <div class="comment-list" data-type="report">
                        ${ad.comments?.reports?.map(comment => `
                            <div class="comment-item">
                                <div class="comment-text">${comment.text}</div>
                                <div class="comment-time">${new Date(comment.createdAt).toLocaleString()}</div>
                            </div>
                        `).join('') || ''}
                    </div>
                </div>
            </div>
            <button class="delete-btn" onclick="deleteAd('${ad._id}')">
                <i class="fas fa-trash"></i> Xóa
            </button>
        </div>
    `;
    
    // Thêm xử lý bình luận
    setupCommentHandlers(card);

    return card;
}

// Hàm xóa quảng cáo
async function deleteAd(id) {
    const password = prompt('Nhập mật khẩu để xóa bài viết:');
    
    if (password !== '2210') {
        alert('Mật khẩu không đúng!');
        return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa quảng cáo này?')) {
        try {
            const response = await fetch(`/api/ads/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Lỗi khi xóa quảng cáo');
            }

            const card = document.querySelector(`[data-id="${id}"]`);
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
}

// Load danh sách quảng cáo khi trang được tải
document.addEventListener('DOMContentLoaded', loadAds); 