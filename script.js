// 当DOM加载完成后执行
 document.addEventListener('DOMContentLoaded', function() {
    // 创建文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // 获取DOM元素
    const albumTitle = document.getElementById('albumTitle');
    const artistName = document.getElementById('artistName');
    const coverImage = document.getElementById('coverImage');
    const downloadBtn = document.getElementById('downloadBtn');
    const thumbnail = document.getElementById('thumbnail');
    const editModeBtn = document.getElementById('editModeBtn');
    const previewModeBtn = document.getElementById('previewModeBtn');
    const transformControls = document.getElementById('transformControls');
    const resetBtn = document.getElementById('resetBtn');
    const editToolSection = document.getElementById('editToolSection');
    const transformToolBtn = document.getElementById('transformToolBtn');
    const transformContainer = document.getElementById('transformContainer');
    const transformCanvas = document.getElementById('transformCanvas');
    const transformHandles = document.getElementById('transformHandles');
    const handles = transformHandles.querySelectorAll('.handle');
    
    // 变量定义
    let currentImage = null; // 当前用户上传的图片
    let originalImage = null; // 原始图片数据
    const templateImage = new Image(); // 模板图片
    let templateLoaded = false; // 模板图片是否加载完成
    let fontLoaded = false; // 字体是否加载完成
    let currentMode = 'preview'; // 当前模式：'edit' 或 'preview'
    let currentTool = 'transform'; // 当前编辑工具：'transform'
    let transformData = null; // 保存变换状态
    let currentColorMode = 'black'; // 当前颜色模式：'black' 或 'white'
    
    // 自由变换相关变量
    let transformCtx;
    let transformImage = new Image();
    let transformState = {
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
        rotation: 0,
        scaleX: 1,
        scaleY: 1
    };
    let isDragging = false;
    let dragType = ''; // 'move', 'resize', 'rotate'
    let startX = 0;
    let startY = 0;
    let startState = {};
    let resizeHandleIndex = -1; // 调整大小的手柄索引
    
    // 初始化自由变换上下文
    transformCtx = transformCanvas.getContext('2d');
    
    // 为变换控制按钮添加事件监听器
    resetBtn.addEventListener('click', function() {
        if (currentTool === 'crop' && cropper) {
            cropper.reset();
            updatePreviewFromCropper();
        } else if (currentTool === 'transform') {
            resetTransform();
        }
    });
    
    // 获取颜色模式按钮
    const blackModeBtn = document.getElementById('blackModeBtn');
    const whiteModeBtn = document.getElementById('whiteModeBtn');
    
    // 颜色模式切换事件监听器
    blackModeBtn.addEventListener('click', function() {
        currentColorMode = 'black';
        blackModeBtn.classList.add('active');
        whiteModeBtn.classList.remove('active');
        updatePreview();
    });
    
    whiteModeBtn.addEventListener('click', function() {
        currentColorMode = 'white';
        whiteModeBtn.classList.add('active');
        blackModeBtn.classList.remove('active');
        updatePreview();
    });
    
    // 自由变换按钮点击事件
    transformToolBtn.addEventListener('click', function() {
        console.log('点击自由变换按钮');
        if (currentTool !== 'transform') {
            console.log('切换到自由变换工具');
            currentTool = 'transform';
            transformToolBtn.classList.add('active');
            updateToolControls();
            
            // 显示自由变换容器
            console.log('显示自由变换容器');
            transformContainer.classList.add('active');
            transformContainer.style.display = 'block';
            
            // 无论是否有图片，都初始化自由变换
            console.log('调用initTransform()');
            initTransform();
        }
    });
    
    // 更新工具控制显示
    function updateToolControls() {
        if (currentTool === 'transform') {
            transformControls.style.display = 'block';
        } else {
            transformControls.style.display = 'none';
        }
    }
    
    // 初始化自由变换
    function initTransform() {
        console.log('初始化自由变换');
        console.log('transformContainer:', transformContainer);
        console.log('transformCanvas:', transformCanvas);
        console.log('transformCtx:', transformCtx);
        
        // 确保自由变换容器是可见的
        transformContainer.style.display = 'block';
        transformContainer.classList.add('active');
        
        if (!originalImage) {
            console.log('没有上传图片，使用默认背景');
            // 如果没有上传图片，使用默认的透明背景
            const containerWidth = transformCanvas.width;
            const containerHeight = transformCanvas.height;
            
            transformState = {
                x: 0,
                y: 0,
                width: containerWidth,
                height: containerHeight,
                rotation: 0,
                scaleX: 1,
                scaleY: 1
            };
            
            // 绘制变换后的图片
            drawTransform();
            
            // 添加鼠标事件监听器
            addTransformEventListeners();
            return;
        }
        
        console.log('有上传图片，加载图片');
        transformImage.src = originalImage;
        transformImage.onload = function() {
            console.log('图片加载完成');
            // 初始化变换状态
            const containerWidth = transformCanvas.width;
            const containerHeight = transformCanvas.height;
            const imageWidth = transformImage.width;
            const imageHeight = transformImage.height;
            
            // 计算缩放比例，使用与updatePreview相同的逻辑
            // 但是以500*500的裁切框为基准
            const cropSize = 500;
            const aspectRatio = imageWidth / imageHeight;
            let scaledWidth, scaledHeight;
            
            if (aspectRatio > 1) {
                // 图片宽度大于高度，以高度为基准，放大宽度
                scaledHeight = cropSize;
                scaledWidth = cropSize * aspectRatio;
            } else {
                // 图片高度大于等于宽度，以宽度为基准，放大高度
                scaledWidth = cropSize;
                scaledHeight = cropSize / aspectRatio;
            }
            
            transformState = {
                x: (containerWidth - scaledWidth) / 2,
                y: (containerHeight - scaledHeight) / 2,
                width: scaledWidth,
                height: scaledHeight,
                rotation: 0,
                scaleX: 1,
                scaleY: 1
            };
            
            // 绘制变换后的图片
            drawTransform();
            
            // 添加鼠标事件监听器
            addTransformEventListeners();
        };
    }
    
    // 绘制变换后的图片
    function drawTransform() {
        console.log('绘制变换后的图片');
        console.log('transformState:', transformState);
        
        if (!transformCtx) {
            console.error('transformCtx 未初始化');
            return;
        }
        
        // 清除画布
        transformCtx.clearRect(0, 0, transformCanvas.width, transformCanvas.height);
        
        // 保存当前状态
        transformCtx.save();
        
        // 移动到图片中心
        const centerX = transformState.x + transformState.width / 2;
        const centerY = transformState.y + transformState.height / 2;
        transformCtx.translate(centerX, centerY);
        
        // 应用旋转
        transformCtx.rotate(transformState.rotation * Math.PI / 180);
        
        // 应用缩放
        transformCtx.scale(transformState.scaleX, transformState.scaleY);
        
        // 绘制图片
        if (originalImage) {
            console.log('绘制图片');
            transformCtx.drawImage(
                transformImage,
                -transformState.width / 2,
                -transformState.height / 2,
                transformState.width,
                transformState.height
            );
        }
        
        // 绘制操作框
        console.log('绘制操作框');
        transformCtx.strokeStyle = '#1db954';
        transformCtx.lineWidth = 2;
        transformCtx.strokeRect(
            -transformState.width / 2,
            -transformState.height / 2,
            transformState.width,
            transformState.height
        );
        
        // 恢复状态
        transformCtx.restore();
        
        // 绘制固定的500*500裁切框
        const cropSize = 500;
        const cropX = (transformCanvas.width - cropSize) / 2;
        const cropY = (transformCanvas.height - cropSize) / 2;
        
        transformCtx.strokeStyle = '#ffffff';
        transformCtx.lineWidth = 2;
        transformCtx.setLineDash([5, 5]);
        transformCtx.strokeRect(cropX, cropY, cropSize, cropSize);
        transformCtx.setLineDash([]);
        
        // 绘制template和文字，与图片保持一致的显示
        if (templateLoaded && templateImage.complete) {
            // 直接使用裁切框的大小，与图片保持一致的显示比例
            const templateWidth = cropSize;
            const templateHeight = cropSize;
            
            // 计算template位置，使其与裁切框完全重合
            const templateX = cropX;
            const templateY = cropY;
            
            // 设置阴影效果，大小为0.5倍
            const shadowScale = 0.5;
            const shadowColor = 'rgba(153, 60, 78, 0.3)';
            const shadowBlur = 8 * shadowScale;
            
            // 计算阴影偏移（角度146°，距离3px）
            const shadowAngle = 146 * Math.PI / 180;
            const shadowDistance = 3 * shadowScale;
            const shadowOffsetX = Math.cos(shadowAngle) * shadowDistance;
            const shadowOffsetY = Math.sin(shadowAngle) * shadowDistance;
            
            // 应用阴影效果
            transformCtx.shadowColor = shadowColor;
            transformCtx.shadowBlur = shadowBlur;
            transformCtx.shadowOffsetX = shadowOffsetX;
            transformCtx.shadowOffsetY = shadowOffsetY;
            
            // 绘制template
            if (currentColorMode === 'black') {
                // 黑色模式，直接绘制原始模板
                transformCtx.drawImage(
                    templateImage,
                    templateX,
                    templateY,
                    templateWidth,
                    templateHeight
                );
            } else {
                // 白色模式，创建临时Canvas进行颜色转换
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = templateWidth;
                tempCanvas.height = templateHeight;
                const tempCtx = tempCanvas.getContext('2d');
                
                // 绘制原始模板
                tempCtx.drawImage(templateImage, 0, 0, templateWidth, templateHeight);
                
                // 获取图片数据
                const imageData = tempCtx.getImageData(0, 0, templateWidth, templateHeight);
                const data = imageData.data;
                
                // 转换颜色：将黑色变为白色，白色变为黑色
                for (let i = 0; i < data.length; i += 4) {
                    // 获取当前像素的RGBA值
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];
                    
                    // 只处理非透明像素
                    if (a > 0) {
                        // 简单的颜色反转：黑色变为白色，白色变为黑色
                        data[i] = 255 - r;     // 红色通道
                        data[i + 1] = 255 - g; // 绿色通道
                        data[i + 2] = 255 - b; // 蓝色通道
                    }
                }
                
                // 放回处理后的数据
                tempCtx.putImageData(imageData, 0, 0);
                
                // 绘制处理后的模板
                transformCtx.drawImage(tempCanvas, templateX, templateY, templateWidth, templateHeight);
            }
            
            // 根据颜色模式设置文字颜色
            const textColor = currentColorMode === 'black' ? '#ffffff' : '#000000';
            
            // 绘制文字
            transformCtx.fillStyle = textColor;
            transformCtx.textAlign = 'center';
            transformCtx.textBaseline = 'top';
            
            // 缩小文字大小
            const fontSize = 9;
            
            // 专辑名称
            transformCtx.font = `italic ${fontSize}px LogoSCUnboundedSans, Helvetica Neue, Arial, sans-serif`;
            transformCtx.fillText(albumTitle.value || '专辑名称', cropX + cropSize/2, templateY + 19.5);
            
            // 歌手名
            transformCtx.font = `italic ${fontSize}px LogoSCUnboundedSans, Helvetica Neue, Arial, sans-serif`;
            transformCtx.fillStyle = textColor;
            transformCtx.fillText(artistName.value || '歌手名', cropX + cropSize/2, templateY + 29);
            
            // 重置阴影效果
            transformCtx.shadowColor = 'transparent';
            transformCtx.shadowOpacity = 0;
            transformCtx.shadowBlur = 0;
            transformCtx.shadowOffsetX = 0;
            transformCtx.shadowOffsetY = 0;
        }
        
        // 更新手柄位置
        updateHandlePositions();
        
        // 更新预览
        updateTransformPreview();
    }
    
    // 更新手柄位置
    function updateHandlePositions() {
        const centerX = transformState.x + transformState.width / 2;
        const centerY = transformState.y + transformState.height / 2;
        const halfWidth = transformState.width / 2 * Math.abs(transformState.scaleX);
        const halfHeight = transformState.height / 2 * Math.abs(transformState.scaleY);
        
        // 计算旋转后的点
        const cos = Math.cos(transformState.rotation * Math.PI / 180);
        const sin = Math.sin(transformState.rotation * Math.PI / 180);
        
        // 顶部左侧
        const tlx = centerX + (-halfWidth * cos - -halfHeight * sin);
        const tly = centerY + (-halfWidth * sin + -halfHeight * cos);
        handles[0].style.left = `${tlx - 8}px`;
        handles[0].style.top = `${tly - 8}px`;
        
        // 顶部
        const tx = centerX + (0 * cos - -halfHeight * sin);
        const ty = centerY + (0 * sin + -halfHeight * cos);
        handles[1].style.left = `${tx - 8}px`;
        handles[1].style.top = `${ty - 8}px`;
        
        // 顶部右侧
        const trx = centerX + (halfWidth * cos - -halfHeight * sin);
        const try_ = centerY + (halfWidth * sin + -halfHeight * cos);
        handles[2].style.left = `${trx - 8}px`;
        handles[2].style.top = `${try_ - 8}px`;
        
        // 右侧
        const rx = centerX + (halfWidth * cos - 0 * sin);
        const ry = centerY + (halfWidth * sin + 0 * cos);
        handles[3].style.left = `${rx - 8}px`;
        handles[3].style.top = `${ry - 8}px`;
        
        // 底部右侧
        const brx = centerX + (halfWidth * cos - halfHeight * sin);
        const bry = centerY + (halfWidth * sin + halfHeight * cos);
        handles[4].style.left = `${brx - 8}px`;
        handles[4].style.top = `${bry - 8}px`;
        
        // 底部
        const bx = centerX + (0 * cos - halfHeight * sin);
        const by = centerY + (0 * sin + halfHeight * cos);
        handles[5].style.left = `${bx - 8}px`;
        handles[5].style.top = `${by - 8}px`;
        
        // 底部左侧
        const blx = centerX + (-halfWidth * cos - halfHeight * sin);
        const bly = centerY + (-halfWidth * sin + halfHeight * cos);
        handles[6].style.left = `${blx - 8}px`;
        handles[6].style.top = `${bly - 8}px`;
        
        // 左侧
        const lx = centerX + (-halfWidth * cos - 0 * sin);
        const ly = centerY + (-halfWidth * sin + 0 * cos);
        handles[7].style.left = `${lx - 8}px`;
        handles[7].style.top = `${ly - 8}px`;
    }
    
    // 添加自由变换事件监听器
    function addTransformEventListeners() {
        // 为手柄添加鼠标事件
        handles.forEach((handle, index) => {
            handle.addEventListener('mousedown', function(e) {
                e.preventDefault();
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                startState = { ...transformState };
                
                // 调整大小手柄，记录手柄索引
                dragType = 'resize';
                resizeHandleIndex = index;
            });
        });
        
        // 鼠标移动事件
        document.addEventListener('mousemove', function(e) {
            // 检测鼠标是否靠近操作点外围，如果是，启用旋转功能
            if (!isDragging) {
                const rect = transformCanvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // 计算图片中心
                const centerX = transformState.x + transformState.width / 2;
                const centerY = transformState.y + transformState.height / 2;
                
                // 计算鼠标到图片中心的距离
                const distance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));
                
                // 计算图片的最大半径
                const maxRadius = Math.sqrt(Math.pow(transformState.width / 2, 2) + Math.pow(transformState.height / 2, 2));
                
                // 如果鼠标在图片外围一定范围内，设置为旋转光标
                if (distance > maxRadius && distance < maxRadius + 50) {
                    transformCanvas.style.cursor = 'grab';
                } else {
                    transformCanvas.style.cursor = 'default';
                }
                
                return;
            }
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            if (dragType === 'move') {
                // 移动图片
                transformState.x = startState.x + deltaX;
                transformState.y = startState.y + deltaY;
            } else if (dragType === 'resize') {
                // 计算当前图片的边界
                const startLeft = startState.x;
                const startTop = startState.y;
                const startRight = startState.x + startState.width;
                const startBottom = startState.y + startState.height;
                
                // 计算新的边界
                let newLeft = startLeft;
                let newTop = startTop;
                let newRight = startRight;
                let newBottom = startBottom;
                
                // 检查是否按住Shift键（等比缩放）
                const isShiftPressed = e.shiftKey;
                const aspectRatio = startState.width / startState.height;
                
                // 根据手柄索引计算新的边界，确保对侧手柄保持固定
                switch (resizeHandleIndex) {
                    case 0: // 左上角 - 右下角保持固定
                        if (isShiftPressed) {
                            // 等比缩放
                            const newWidth = startRight - (startLeft + deltaX);
                            const newHeight = newWidth / aspectRatio;
                            newLeft = startRight - newWidth;
                            newTop = startBottom - newHeight;
                            newRight = startRight;
                            newBottom = startBottom;
                        } else {
                            // 自由缩放
                            newLeft = startLeft + deltaX;
                            newTop = startTop + deltaY;
                            newRight = startRight;
                            newBottom = startBottom;
                        }
                        break;
                    case 1: // 顶部 - 底部保持固定
                        if (isShiftPressed) {
                            // 等比缩放
                            const newHeight = startBottom - (startTop + deltaY);
                            const newWidth = newHeight * aspectRatio;
                            const widthDelta = (startState.width - newWidth) / 2;
                            newTop = startTop + deltaY;
                            newLeft = startLeft + widthDelta;
                            newRight = startRight - widthDelta;
                            newBottom = startBottom;
                        } else {
                            // 自由缩放
                            newTop = startTop + deltaY;
                            newBottom = startBottom;
                        }
                        break;
                    case 2: // 右上角 - 左下角保持固定
                        if (isShiftPressed) {
                            // 等比缩放
                            const newWidth = startRight + deltaX - startLeft;
                            const newHeight = newWidth / aspectRatio;
                            newRight = startLeft + newWidth;
                            newTop = startBottom - newHeight;
                            newLeft = startLeft;
                            newBottom = startBottom;
                        } else {
                            // 自由缩放
                            newRight = startRight + deltaX;
                            newTop = startTop + deltaY;
                            newLeft = startLeft;
                            newBottom = startBottom;
                        }
                        break;
                    case 3: // 右侧 - 左侧保持固定
                        if (isShiftPressed) {
                            // 等比缩放
                            const newWidth = startRight + deltaX - startLeft;
                            const newHeight = newWidth / aspectRatio;
                            const heightDelta = (startState.height - newHeight) / 2;
                            newRight = startRight + deltaX;
                            newTop = startTop + heightDelta;
                            newBottom = startBottom - heightDelta;
                            newLeft = startLeft;
                        } else {
                            // 自由缩放
                            newRight = startRight + deltaX;
                            newLeft = startLeft;
                        }
                        break;
                    case 4: // 右下角 - 左上角保持固定
                        if (isShiftPressed) {
                            // 等比缩放
                            const newWidth = startRight + deltaX - startLeft;
                            const newHeight = newWidth / aspectRatio;
                            newRight = startLeft + newWidth;
                            newBottom = startTop + newHeight;
                            newLeft = startLeft;
                            newTop = startTop;
                        } else {
                            // 自由缩放
                            newRight = startRight + deltaX;
                            newBottom = startBottom + deltaY;
                            newLeft = startLeft;
                            newTop = startTop;
                        }
                        break;
                    case 5: // 底部 - 顶部保持固定
                        if (isShiftPressed) {
                            // 等比缩放
                            const newHeight = startBottom + deltaY - startTop;
                            const newWidth = newHeight * aspectRatio;
                            const widthDelta = (startState.width - newWidth) / 2;
                            newBottom = startBottom + deltaY;
                            newLeft = startLeft + widthDelta;
                            newRight = startRight - widthDelta;
                            newTop = startTop;
                        } else {
                            // 自由缩放
                            newBottom = startBottom + deltaY;
                            newTop = startTop;
                        }
                        break;
                    case 6: // 左下角 - 右上角保持固定
                        if (isShiftPressed) {
                            // 等比缩放
                            const newWidth = startRight - (startLeft + deltaX);
                            const newHeight = newWidth / aspectRatio;
                            newLeft = startRight - newWidth;
                            newBottom = startTop + newHeight;
                            newRight = startRight;
                            newTop = startTop;
                        } else {
                            // 自由缩放
                            newLeft = startLeft + deltaX;
                            newBottom = startBottom + deltaY;
                            newRight = startRight;
                            newTop = startTop;
                        }
                        break;
                    case 7: // 左侧 - 右侧保持固定
                        if (isShiftPressed) {
                            // 等比缩放
                            const newWidth = startRight - (startLeft + deltaX);
                            const newHeight = newWidth / aspectRatio;
                            const heightDelta = (startState.height - newHeight) / 2;
                            newLeft = startLeft + deltaX;
                            newTop = startTop + heightDelta;
                            newBottom = startBottom - heightDelta;
                            newRight = startRight;
                        } else {
                            // 自由缩放
                            newLeft = startLeft + deltaX;
                            newRight = startRight;
                        }
                        break;
                }
                
                // 计算新的宽度和高度
                const newWidth = newRight - newLeft;
                const newHeight = newBottom - newTop;
                
                // 确保宽度和高度为正数
                if (newWidth > 10 && newHeight > 10) {
                    // 直接更新变换状态，不使用缩放因子
                    transformState.x = newLeft;
                    transformState.y = newTop;
                    transformState.width = newWidth;
                    transformState.height = newHeight;
                    // 保持旋转角度不变
                    transformState.rotation = startState.rotation;
                    // 重置缩放因子，因为我们直接操作宽度和高度
                    transformState.scaleX = 1;
                    transformState.scaleY = 1;
                }
            } else if (dragType === 'rotate') {
                // 旋转图片
                const rect = transformCanvas.getBoundingClientRect();
                const centerX = startState.x + startState.width / 2;
                const centerY = startState.y + startState.height / 2;
                
                // 计算起始角度和当前角度
                const startAngle = Math.atan2(startY - rect.top - centerY, startX - rect.left - centerX);
                const currentAngle = Math.atan2(e.clientY - rect.top - centerY, e.clientX - rect.left - centerX);
                
                // 计算角度差
                const angleDelta = (currentAngle - startAngle) * 180 / Math.PI;
                
                // 应用旋转
                transformState.rotation = startState.rotation + angleDelta;
            }
            
            // 绘制变换后的图片
            drawTransform();
        });
        
        // 为变换容器添加鼠标事件
        transformCanvas.addEventListener('mousedown', function(e) {
            e.preventDefault();
            if (!isDragging) {
                const rect = transformCanvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // 计算图片中心
                const centerX = transformState.x + transformState.width / 2;
                const centerY = transformState.y + transformState.height / 2;
                
                // 计算鼠标到图片中心的距离
                const distance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));
                
                // 计算图片的最大半径
                const maxRadius = Math.sqrt(Math.pow(transformState.width / 2, 2) + Math.pow(transformState.height / 2, 2));
                
                // 如果鼠标在图片外围一定范围内，启用旋转
                if (distance > maxRadius && distance < maxRadius + 50) {
                    isDragging = true;
                    dragType = 'rotate';
                    startX = e.clientX;
                    startY = e.clientY;
                    startState = { ...transformState };
                } else {
                    // 否则，正常移动
                    isDragging = true;
                    dragType = 'move';
                    startX = e.clientX;
                    startY = e.clientY;
                    startState = { ...transformState };
                }
            }
        });
        
        // 鼠标释放事件
        document.addEventListener('mouseup', function() {
            isDragging = false;
            dragType = '';
            resizeHandleIndex = -1;
            // 重置光标
            transformCanvas.style.cursor = 'default';
        });
    }
    
    // 重置自由变换
    function resetTransform() {
        if (!originalImage) return;
        
        const containerWidth = transformCanvas.width;
        const containerHeight = transformCanvas.height;
        const imageWidth = transformImage.width;
        const imageHeight = transformImage.height;
        
        // 计算缩放比例，使用与initTransform相同的逻辑
        // 但是以500*500的裁切框为基准
        const cropSize = 500;
        const aspectRatio = imageWidth / imageHeight;
        let scaledWidth, scaledHeight;
        
        if (aspectRatio > 1) {
            // 图片宽度大于高度，以高度为基准，放大宽度
            scaledHeight = cropSize;
            scaledWidth = cropSize * aspectRatio;
        } else {
            // 图片高度大于等于宽度，以宽度为基准，放大高度
            scaledWidth = cropSize;
            scaledHeight = cropSize / aspectRatio;
        }
        
        transformState = {
            x: (containerWidth - scaledWidth) / 2,
            y: (containerHeight - scaledHeight) / 2,
            width: scaledWidth,
            height: scaledHeight,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
        };
        
        // 绘制变换后的图片
        drawTransform();
    }
    
    // 更新自由变换预览
    function updateTransformPreview() {
        // 创建预览Canvas
        const previewCanvas = document.createElement('canvas');
        const previewSize = 1000;
        previewCanvas.width = previewSize;
        previewCanvas.height = previewSize;
        const ctx = previewCanvas.getContext('2d');
        
        // 清除画布
        ctx.clearRect(0, 0, previewSize, previewSize);
        
        // 添加阴影效果
        ctx.shadowColor = 'rgba(153, 60, 78, 0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2.45;
        ctx.shadowOffsetY = 1.72;
        
        // 绘制变换后的图片
        ctx.save();
        const centerX = transformState.x + transformState.width / 2;
        const centerY = transformState.y + transformState.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(transformState.rotation * Math.PI / 180);
        ctx.scale(transformState.scaleX, transformState.scaleY);
        ctx.drawImage(
            transformImage,
            -transformState.width / 2,
            -transformState.height / 2,
            transformState.width,
            transformState.height
        );
        ctx.restore();
        
        // 绘制模板图片
        if (templateLoaded && templateImage.complete) {
            if (currentColorMode === 'black') {
                // 黑色模式，直接绘制原始模板
                ctx.drawImage(templateImage, 0, 0, previewSize, previewSize);
            } else {
                // 白色模式，创建临时Canvas进行颜色转换
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = previewSize;
                tempCanvas.height = previewSize;
                const tempCtx = tempCanvas.getContext('2d');
                
                // 绘制原始模板
                tempCtx.drawImage(templateImage, 0, 0, previewSize, previewSize);
                
                // 获取图片数据
                const imageData = tempCtx.getImageData(0, 0, previewSize, previewSize);
                const data = imageData.data;
                
                // 转换颜色：将黑色变为白色，白色变为黑色
                for (let i = 0; i < data.length; i += 4) {
                    // 获取当前像素的RGBA值
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];
                    
                    // 只处理非透明像素
                    if (a > 0) {
                        // 简单的颜色反转：黑色变为白色，白色变为黑色
                        data[i] = 255 - r;     // 红色通道
                        data[i + 1] = 255 - g; // 绿色通道
                        data[i + 2] = 255 - b; // 蓝色通道
                    }
                }
                
                // 放回处理后的数据
                tempCtx.putImageData(imageData, 0, 0);
                
                // 绘制处理后的模板
                ctx.drawImage(tempCanvas, 0, 0, previewSize, previewSize);
            }
        }
        
        // 根据颜色模式设置文字颜色
        const textColor = currentColorMode === 'black' ? '#ffffff' : '#000000';
        
        // 绘制文字
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // 专辑名称
        ctx.font = 'italic 18px LogoSCUnboundedSans, Helvetica Neue, Arial, sans-serif';
        ctx.fillText(albumTitle.value || '专辑名称', previewSize/2, 39);
        
        // 歌手名
        ctx.font = 'italic 18px LogoSCUnboundedSans, Helvetica Neue, Arial, sans-serif';
        ctx.fillStyle = textColor;
        ctx.fillText(artistName.value || '歌手名', previewSize/2, 58);
        
        // 重置阴影效果
        ctx.shadowColor = 'transparent';
        ctx.shadowOpacity = 0;
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 更新预览区域
        coverImage.style.backgroundImage = `url(${previewCanvas.toDataURL('image/png')})`;
        coverImage.style.backgroundSize = 'contain';
        coverImage.style.backgroundPosition = 'center';
        coverImage.style.backgroundRepeat = 'no-repeat';
        
        // 更新缩略图
        thumbnail.style.backgroundImage = `url(${previewCanvas.toDataURL('image/png')})`;
        thumbnail.style.backgroundSize = 'contain';
        thumbnail.style.backgroundPosition = 'center';
        thumbnail.style.backgroundRepeat = 'no-repeat';
    }
    
    // 加载字体
    function loadFont() {
        const font = new FontFace('LogoSCUnboundedSans', 'url(LogoSCUnboundedSans-Regular-2.ttf)');
        font.load().then(function(loadedFont) {
            document.fonts.add(loadedFont);
            fontLoaded = true;
            console.log('字体加载成功');
            updatePreview();
        }).catch(function(error) {
            console.log('字体加载失败:', error);
            fontLoaded = true; // 即使加载失败也继续，使用备用字体
            updatePreview();
        });
    }
    
    // 模板图片加载完成后更新预览
    templateImage.onload = function() {
        templateLoaded = true;
        console.log('模板图片加载成功');
        updatePreview();
    };
    templateImage.onerror = function() {
        console.log('模板图片未找到，使用默认背景');
        templateLoaded = true;
        updatePreview();
    };
    // 确保模板图片能够加载
    templateImage.crossOrigin = 'anonymous';
    templateImage.src = 'template.png?timestamp=' + new Date().getTime();
    
    // 启动字体加载
    loadFont();
    
    // 模式切换按钮点击事件
    editModeBtn.addEventListener('click', function() {
        switchMode('edit');
    });
    
    previewModeBtn.addEventListener('click', function() {
        switchMode('preview');
    });
    
    // 文件输入 change 事件
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFile(this.files[0]);
        }
    });
    
    // 切换模式函数
    function switchMode(mode) {
        currentMode = mode;
        
        if (mode === 'edit') {
            // 切换到编辑模式
            editModeBtn.classList.add('active');
            previewModeBtn.classList.remove('active');
            editToolSection.style.display = 'block';
            
            // 隐藏原有的模板和文字
            const coverImage = document.getElementById('coverImage');
            coverImage.style.display = 'none';
            
            // 更新工具控制显示
            updateToolControls();
            
            // 显示自由变换容器
            transformContainer.classList.add('active');
            transformContainer.style.display = 'block';
            
            if (originalImage) {
                // 如果已经有变换状态，使用之前的状态
                if (transformData) {
                    transformState = { ...transformData };
                    drawTransform();
                    addTransformEventListeners();
                } else {
                    // 初始化自由变换
                    initTransform();
                }
            }
        } else {
            // 切换到预览模式
            editModeBtn.classList.remove('active');
            previewModeBtn.classList.add('active');
            transformContainer.classList.remove('active');
            transformContainer.style.display = 'none';
            editToolSection.style.display = 'none';
            transformControls.style.display = 'none';
            
            // 显示原有的模板和文字
            const coverImage = document.getElementById('coverImage');
            coverImage.style.display = 'block';
            
            // 保存自由变换状态并获取当前图片数据
            if (currentTool === 'transform') {
                // 保存自由变换状态
                transformData = { ...transformState };
                
                // 创建变换后的图片数据
                const canvas = document.createElement('canvas');
                canvas.width = 3000;
                canvas.height = 3000;
                const ctx = canvas.getContext('2d');
                
                // 清除画布
                ctx.clearRect(0, 0, 3000, 3000);
                
                // 绘制变换后的图片，只保存500*500裁切框内的内容
                ctx.save();
                const scale = 3000 / 500; // 500*500裁切框对应3000*3000输出
                
                // 计算图片在裁切框内的位置
                const cropSize = 500;
                const cropX = (1000 - cropSize) / 2;
                const cropY = (1000 - cropSize) / 2;
                
                // 计算图片相对于裁切框的位置
                const imageCropX = transformState.x - cropX;
                const imageCropY = transformState.y - cropY;
                const centerX = (imageCropX + transformState.width / 2) * scale;
                const centerY = (imageCropY + transformState.height / 2) * scale;
                
                ctx.translate(centerX, centerY);
                ctx.rotate(transformState.rotation * Math.PI / 180);
                ctx.scale(transformState.scaleX, transformState.scaleY);
                
                if (originalImage) {
                    ctx.drawImage(
                        transformImage,
                        -transformState.width / 2 * scale,
                        -transformState.height / 2 * scale,
                        transformState.width * scale,
                        transformState.height * scale
                    );
                }
                
                ctx.restore();
                
                currentImage = canvas.toDataURL('image/jpeg', 0.9);
            }
            
            // 更新预览，显示最终效果
            updatePreview();
        }
    }
    

    
    // 拖放功能 - 预览区域
    const coverPreview = document.getElementById('coverPreview');
    coverPreview.addEventListener('dragover', function(e) {
        e.preventDefault();
        coverPreview.style.border = '2px dashed #1db954';
    });
    
    coverPreview.addEventListener('dragleave', function() {
        coverPreview.style.border = 'none';
    });
    
    coverPreview.addEventListener('drop', function(e) {
        e.preventDefault();
        coverPreview.style.border = 'none';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // 点击和双击事件处理
    let clickTimer = null;
    coverPreview.addEventListener('click', function() {
        // 只有在预览模式下才处理点击
        if (currentMode === 'preview') {
            // 清除之前的定时器
            if (clickTimer) {
                clearTimeout(clickTimer);
            }
            
            // 设置新的定时器，判断是单击还是双击
            clickTimer = setTimeout(function() {
                // 单击事件：提示用户按 Ctrl+V 粘贴图片
                console.log('单击：请按 Ctrl+V 粘贴图片');
            }, 300);
        }
    });
    
    coverPreview.addEventListener('dblclick', function() {
        // 清除定时器，确认是双击
        if (clickTimer) {
            clearTimeout(clickTimer);
        }
        
        // 只有在预览模式下才触发文件选择
        if (currentMode === 'preview') {
            fileInput.click();
        }
    });
    
    // 粘贴功能
    document.addEventListener('paste', function(e) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                const file = items[i].getAsFile();
                handleFile(file);
                break;
            }
        }
    });
    
    // 处理文件上传
    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImage = e.target.result;
            originalImage = e.target.result; // 保存原始图片数据
            
            // 更新预览
            updatePreview();
            
            // 如果当前是编辑模式，初始化自由变换
            if (currentMode === 'edit') {
                initTransform();
            }
        };
        reader.readAsDataURL(file);
    }
    
    // 实时更新预览
    albumTitle.addEventListener('input', function() {
        updatePreview();
    });
    
    artistName.addEventListener('input', function() {
        updatePreview();
    });
    
    // 实时预览函数
    function updatePreview() {
        // 创建预览Canvas
        const previewCanvas = document.createElement('canvas');
        const previewSize = 1000; // 预览尺寸
        
        // 设置canvas实际尺寸
        previewCanvas.width = previewSize;
        previewCanvas.height = previewSize;
        
        const ctx = previewCanvas.getContext('2d');
        
        // 绘制透明背景
        ctx.clearRect(0, 0, previewSize, previewSize);
        
        // 添加阴影效果
        ctx.shadowColor = 'rgba(153, 60, 78, 0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2.45;
        ctx.shadowOffsetY = 1.72;
        
        if (currentImage) {
            // 获取图片数据
            let imageData = currentImage;
            
            // 绘制用户图片
            const userImage = new Image();
            userImage.onload = function() {
                // 绘制用户图片（保持原始比例，放大到覆盖整个画布）
                const aspectRatio = userImage.width / userImage.height;
                let drawWidth, drawHeight, drawX, drawY;
                
                if (aspectRatio > 1) {
                    // 图片宽度大于高度，以高度为基准，放大宽度
                    drawHeight = previewSize;
                    drawWidth = previewSize * aspectRatio;
                    drawX = (previewSize - drawWidth) / 2;
                    drawY = 0;
                } else {
                    // 图片高度大于等于宽度，以宽度为基准，放大高度
                    drawWidth = previewSize;
                    drawHeight = previewSize / aspectRatio;
                    drawX = 0;
                    drawY = (previewSize - drawHeight) / 2;
                }
                
                ctx.drawImage(userImage, drawX, drawY, drawWidth, drawHeight);
                
                // 绘制模板图片
                if (templateLoaded && templateImage.complete) {
                    if (currentColorMode === 'black') {
                        // 黑色模式，直接绘制原始模板
                        ctx.drawImage(templateImage, 0, 0, previewSize, previewSize);
                    } else {
                        // 白色模式，创建临时Canvas进行颜色转换
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = previewSize;
                        tempCanvas.height = previewSize;
                        const tempCtx = tempCanvas.getContext('2d');
                        
                        // 绘制原始模板
                        tempCtx.drawImage(templateImage, 0, 0, previewSize, previewSize);
                        
                        // 获取图片数据
                        const imageData = tempCtx.getImageData(0, 0, previewSize, previewSize);
                        const data = imageData.data;
                        
                        // 转换颜色：将黑色变为白色，白色变为黑色
                        for (let i = 0; i < data.length; i += 4) {
                            // 获取当前像素的RGBA值
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];
                            const a = data[i + 3];
                            
                            // 只处理非透明像素
                            if (a > 0) {
                                // 简单的颜色反转：黑色变为白色，白色变为黑色
                                data[i] = 255 - r;     // 红色通道
                                data[i + 1] = 255 - g; // 绿色通道
                                data[i + 2] = 255 - b; // 蓝色通道
                            }
                        }
                        
                        // 放回处理后的数据
                        tempCtx.putImageData(imageData, 0, 0);
                        
                        // 绘制处理后的模板
                        ctx.drawImage(tempCanvas, 0, 0, previewSize, previewSize);
                    }
                }
                
                // 确保字体加载完成后再绘制文字
                function drawText() {
                    // 根据颜色模式设置文字颜色
                    const textColor = currentColorMode === 'black' ? '#ffffff' : '#000000';
                    
                    // 绘制文字
                    ctx.fillStyle = textColor;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    
                    // 专辑名称
                    ctx.font = 'italic 18px LogoSCUnboundedSans, Helvetica Neue, Arial, sans-serif';
                    ctx.fillText(albumTitle.value || '专辑名称', previewSize/2, 39);
                    
                    // 歌手名
                    ctx.font = 'italic 18px LogoSCUnboundedSans, Helvetica Neue, Arial, sans-serif';
                    ctx.fillStyle = textColor;
                    ctx.fillText(artistName.value || '歌手名', previewSize/2, 58);
                    
                    // 重置阴影效果
                    ctx.shadowColor = 'transparent';
                    ctx.shadowOpacity = 0;
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    
                    // 更新预览区域
                    const coverImage = document.getElementById('coverImage');
                    coverImage.style.backgroundImage = `url(${previewCanvas.toDataURL('image/png')})`;
                    coverImage.style.backgroundSize = 'contain';
                    coverImage.style.backgroundPosition = 'center';
                    coverImage.style.backgroundRepeat = 'no-repeat';
                    
                    // 更新缩略图
                    const thumbnail = document.getElementById('thumbnail');
                    thumbnail.style.backgroundImage = `url(${previewCanvas.toDataURL('image/png')})`;
                    thumbnail.style.backgroundSize = 'contain';
                    thumbnail.style.backgroundPosition = 'center';
                    thumbnail.style.backgroundRepeat = 'no-repeat';
                }
                
                // 检查字体是否加载完成
                if (fontLoaded) {
                    drawText();
                } else {
                    // 如果字体未加载完成，等待一段时间后重试
                    setTimeout(drawText, 100);
                }
            };
            userImage.src = imageData;
        } else {
            // 初始状态：透明底，显示模板和默认文字
            // 绘制模板图片
            if (templateLoaded && templateImage.complete) {
                if (currentColorMode === 'black') {
                    // 黑色模式，直接绘制原始模板
                    ctx.drawImage(templateImage, 0, 0, previewSize, previewSize);
                } else {
                    // 白色模式，创建临时Canvas进行颜色转换
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = previewSize;
                    tempCanvas.height = previewSize;
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    // 绘制原始模板
                    tempCtx.drawImage(templateImage, 0, 0, previewSize, previewSize);
                    
                    // 获取图片数据
                    const imageData = tempCtx.getImageData(0, 0, previewSize, previewSize);
                    const data = imageData.data;
                    
                    // 转换颜色：将黑色变为白色，白色变为黑色
                    for (let i = 0; i < data.length; i += 4) {
                        // 获取当前像素的RGBA值
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const a = data[i + 3];
                        
                        // 只处理非透明像素
                        if (a > 0) {
                            // 简单的颜色反转：黑色变为白色，白色变为黑色
                            data[i] = 255 - r;     // 红色通道
                            data[i + 1] = 255 - g; // 绿色通道
                            data[i + 2] = 255 - b; // 蓝色通道
                        }
                    }
                    
                    // 放回处理后的数据
                    tempCtx.putImageData(imageData, 0, 0);
                    
                    // 绘制处理后的模板
                    ctx.drawImage(tempCanvas, 0, 0, previewSize, previewSize);
                }
            }
            
            // 根据颜色模式设置文字颜色
            const textColor = currentColorMode === 'black' ? '#ffffff' : '#000000';
            
            // 绘制文字
            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            // 专辑名称
            ctx.font = 'italic 18px LogoSCUnboundedSans, Helvetica Neue, Arial, sans-serif';
            ctx.fillText(albumTitle.value || '专辑名称', previewSize/2, 39);
            
            // 歌手名
            ctx.font = 'italic 18px LogoSCUnboundedSans, Helvetica Neue, Arial, sans-serif';
            ctx.fillStyle = textColor;
            ctx.fillText(artistName.value || '歌手名', previewSize/2, 58);
            
            // 重置阴影效果
            ctx.shadowColor = 'transparent';
            ctx.shadowOpacity = 0;
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // 更新预览区域
            const coverImage = document.getElementById('coverImage');
            coverImage.style.backgroundImage = `url(${previewCanvas.toDataURL('image/png')})`;
            coverImage.style.backgroundSize = 'contain';
            coverImage.style.backgroundPosition = 'center';
            coverImage.style.backgroundRepeat = 'no-repeat';
            
            // 更新缩略图
            const thumbnail = document.getElementById('thumbnail');
            thumbnail.style.backgroundImage = `url(${previewCanvas.toDataURL('image/png')})`;
            thumbnail.style.backgroundSize = 'contain';
            thumbnail.style.backgroundPosition = 'center';
            thumbnail.style.backgroundRepeat = 'no-repeat';
        }
    }
    
    // 下载封面
    downloadBtn.addEventListener('click', function() {
        // 即使没有上传图片也可以下载
        
        // 显示加载状态
        downloadBtn.textContent = '生成中...';
        downloadBtn.disabled = true;
        
        // 创建Canvas元素
        const canvas = document.createElement('canvas');
        const size = 3000; // 输出图片尺寸为3000*3000px
        
        // 设置canvas实际尺寸
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        
        // 绘制透明背景
        ctx.clearRect(0, 0, size, size);
        
        // 添加阴影效果
        ctx.shadowColor = 'rgba(153, 60, 78, 0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2.45;
        ctx.shadowOffsetY = 1.72;
        
        // 如果有图片，绘制用户上传的图片
        if (currentImage) {
            // 获取图片数据
            const userImage = new Image();
            userImage.onload = function() {
                // 先绘制用户图片（保持原始比例，放大到覆盖整个画布）
                const aspectRatio = userImage.width / userImage.height;
                let drawWidth, drawHeight, drawX, drawY;
                
                if (aspectRatio > 1) {
                    // 图片宽度大于高度，以高度为基准，放大宽度
                    drawHeight = size;
                    drawWidth = size * aspectRatio;
                    drawX = (size - drawWidth) / 2;
                    drawY = 0;
                } else {
                    // 图片高度大于等于宽度，以宽度为基准，放大高度
                    drawWidth = size;
                    drawHeight = size / aspectRatio;
                    drawX = 0;
                    drawY = (size - drawHeight) / 2;
                }
                
                ctx.drawImage(userImage, drawX, drawY, drawWidth, drawHeight);
                console.log('用户图片绘制完成');
                
                // 然后绘制模板背景（在用户图片之上）
                if (templateLoaded && templateImage.complete) {
                    if (currentColorMode === 'black') {
                        // 黑色模式，直接绘制原始模板
                        ctx.drawImage(templateImage, 0, 0, size, size);
                    } else {
                        // 白色模式，创建临时Canvas进行颜色转换
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = size;
                        tempCanvas.height = size;
                        const tempCtx = tempCanvas.getContext('2d');
                        
                        // 绘制原始模板
                        tempCtx.drawImage(templateImage, 0, 0, size, size);
                        
                        // 获取图片数据
                        const imageData = tempCtx.getImageData(0, 0, size, size);
                        const data = imageData.data;
                        
                        // 转换颜色：将黑色变为白色，白色变为黑色
                        for (let i = 0; i < data.length; i += 4) {
                            // 获取当前像素的RGBA值
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];
                            const a = data[i + 3];
                            
                            // 只处理非透明像素
                            if (a > 0) {
                                // 简单的颜色反转：黑色变为白色，白色变为黑色
                                data[i] = 255 - r;     // 红色通道
                                data[i + 1] = 255 - g; // 绿色通道
                                data[i + 2] = 255 - b; // 蓝色通道
                            }
                        }
                        
                        // 放回处理后的数据
                        tempCtx.putImageData(imageData, 0, 0);
                        
                        // 绘制处理后的模板
                        ctx.drawImage(tempCanvas, 0, 0, size, size);
                    }
                    console.log('模板图片绘制完成');
                } else {
                    // 如果模板不存在，使用默认背景
                    console.log('模板图片不可用');
                }
                
                drawText();
            };
            userImage.src = currentImage;
        } else {
            // 没有图片，绘制模板和文字
            // 绘制模板图片
            if (templateLoaded && templateImage.complete) {
                ctx.drawImage(templateImage, 0, 0, size, size);
                console.log('模板图片绘制完成');
            } else {
                // 如果模板不存在，使用默认背景
                console.log('模板图片不可用');
            }
            
            // 绘制文字
            drawText();
        }
        
        // 确保字体加载完成后再绘制文字
        function drawText() {
            // 根据颜色模式设置文字颜色
            const textColor = currentColorMode === 'black' ? '#ffffff' : '#000000';
            const secondaryTextColor = currentColorMode === 'black' ? '#b3b3b3' : '#666666';
            
            // 绘制文字
            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            // 专辑名称
            ctx.font = 'italic 54px LogoSCUnboundedSans, Helvetica Neue, Arial, sans-serif';
            ctx.fillStyle = textColor;
            ctx.fillText(albumTitle.value || '专辑名称', size/2, 117);
            
            // 歌手名
            ctx.font = 'italic 54px LogoSCUnboundedSans, Helvetica Neue, Arial, sans-serif';
            ctx.fillStyle = secondaryTextColor;
            ctx.fillText(artistName.value || '歌手名', size/2, 174);
            
            // 重置阴影效果
            ctx.shadowColor = 'transparent';
            ctx.shadowOpacity = 0;
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // 生成图片数据
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            
            // 更新预览区域显示生成的图片
            const coverImage = document.getElementById('coverImage');
            coverImage.style.backgroundImage = `url(${dataUrl})`;
            coverImage.style.backgroundSize = 'contain';
            coverImage.style.backgroundPosition = 'center';
            coverImage.style.backgroundRepeat = 'no-repeat';
            
            // 下载图片为JPG
            try {
                // 确保文件名有效
                const fileName = `${albumTitle.value || 'album'}_${artistName.value || 'artist'}.jpg`;
                
                // 创建下载链接
                const link = document.createElement('a');
                link.download = fileName;
                link.href = dataUrl;
                link.style.display = 'none';
                
                // 添加到DOM并点击
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                console.log('下载成功');
            } catch (error) {
                console.error('下载失败:', error);
                alert('下载失败，请重试');
            } finally {
                // 恢复按钮状态
                downloadBtn.textContent = '下载封面';
                downloadBtn.disabled = false;
            }
        }
    });
});
