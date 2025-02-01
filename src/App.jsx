import * as bootstrap from 'bootstrap';
import { useState, useEffect, useRef } from 'react';

import './assets/style.css';

const { VITE_URL, VITE_PATH } = import.meta.env;

function App() {
  const productModalRef = useRef(null);
  const [modalType, setModalType] = useState('');
  const [templateData, setTemplateData] = useState({
    id: '',
    imageUrl: '',
    title: '',
    category: '',
    unit: '',
    origin_price: '',
    price: '',
    description: '',
    content: '',
    is_enabled: false,
    imagesUrl: [],
  });

  const openModal = (product, type) => {
    setTemplateData({
      id: product.id || '',
      imageUrl: product.imageUrl || '',
      title: product.title || '',
      category: product.category || '',
      unit: product.unit || '',
      origin_price: product.origin_price || '',
      price: product.price || '',
      description: product.description || '',
      content: product.content || '',
      is_enabled: product.is_enabled || false,
      imagesUrl: product.imagesUrl || [],
    });
    productModalRef.current.show();
    setModalType(type);
  };

  const closeModal = () => {
    productModalRef.current.hide();
  };

  const handleModalInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setTemplateData((prevData) => ({
      ...prevData,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (index, value) => {
    setTemplateData((prevData) => {
      const newImages = [...prevData.imagesUrl];
      newImages[index] = value;

      if (
        value !== '' &&
        index === newImages.length - 1 &&
        newImages.length < 5
      ) {
        newImages.push('');
      }

      if (newImages.length > 1 && newImages[newImages.length - 1] === '') {
        newImages.pop();
      }

      return { ...prevData, imagesUrl: newImages };
    });
  };

  const handleAddImage = () => {
    setTemplateData((prevData) => ({
      ...prevData,
      imagesUrl: [...prevData.imagesUrl, ''],
    }));
  };

  const handleRemoveImage = () => {
    setTemplateData((prevData) => {
      const newImages = [...prevData.imagesUrl];
      newImages.pop();
      return { ...prevData, imagesUrl: newImages };
    });
  };

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isAuth, setIsAuth] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // const token = document.cookie
    // .split('; ')
    // .find((row) => row.startsWith('hexToken='))
    //   ?.split('=')[1];

    productModalRef.current = new bootstrap.Modal('#productModal', {
      keyboard: false,
    });

    document
      .querySelector('#productModal')
      .addEventListener('hide.bs.modal', () => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      });

    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)hexToken\s*=\s*([^;]*).*$)|^.*$/,
      '$1'
    );

    setToken(token);

    if (token && token !== undefined) checkAdmin(token);
  }, []);

  const checkAdmin = async (token) => {
    try {
      const response = await fetch(`${VITE_URL}/api/user/check`, {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          Authorization: token,
        }),
      });

      const data = await response.json();

      if (data.success) {
        getProducts(token);
        setIsAuth(true);
      }
    } catch (error) {
      console.log(error.response.data.message);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${VITE_URL}/admin/signin`, {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
      });

      const data = await response.json();

      if (data.success) {
        const { token, expired } = data;
        document.cookie = `hexToken=${token};expires=${new Date(expired)};`;
        setToken(token);
        setIsAuth(true);
        getProducts(token);
      }
    } catch (error) {
      console.error('登入失敗: ' + error.response.data.message);
    }
  };

  //API
  const [products, setProducts] = useState([]);
  const getProducts = async (token) => {
    try {
      const response = await fetch(
        `${VITE_URL}/api/${VITE_PATH}/admin/products`,
        {
          method: 'GET',
          headers: new Headers({
            'Content-Type': 'application/json',
            Authorization: token,
          }),
        }
      );

      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error(error.response.data.message);
    }
  };

  const updateProductData = async (id) => {
    let product;
    if (modalType === 'edit') {
      product = `product/${id}`;
    } else {
      product = `product`;
    }

    const url = `${VITE_URL}/api/${VITE_PATH}/admin/${product}`;

    const body = JSON.stringify({
      data: {
        ...templateData,
        origin_price: Number(templateData.origin_price),
        price: Number(templateData.price),
        is_enabled: templateData.is_enabled ? 1 : 0,
        imagesUrl: templateData.imagesUrl,
      },
    });

    const headers = new Headers({
      'Content-Type': 'application/json',
      Authorization: token,
    });

    try {
      let response;
      if (modalType === 'edit') {
        response = await fetch(url, {
          method: 'PUT',
          body,
          headers,
        });

        const data = await response.json();

        alert('更新成功', data.message);
      } else {
        response = await fetch(url, {
          method: 'POST',
          body,
          headers,
        });

        const data = await response.json();

        alert('新增成功', data.message);
      }

      closeModal();
      getProducts(token);
    } catch (error) {
      if (modalType === 'edit') {
        console.error('更新失敗', error.response.data.message);
      } else {
        console.log(error);
        console.error('新增失敗', error.response.data.message);
      }
    }
  };

  const delProductData = async (id) => {
    try {
      const response = await fetch(
        `${VITE_URL}/api/${VITE_PATH}/admin/product/${id}`,
        {
          method: 'DELETE',
          headers: new Headers({
            'Content-Type': 'application/json',
            Authorization: token,
          }),
        }
      );

      const data = await response.json();

      alert('刪除成功', data.message);

      closeModal();
      getProducts(token);
    } catch (error) {
      console.error('刪除失敗', error.response.data.message);
    }
  };

  return (
    <>
      {isAuth ? (
        <div>
          <div className='container'>
            <div className='text-end mt-4'>
              <button
                className='btn btn-primary'
                onClick={() => openModal('new')}
              >
                建立新的產品
              </button>
            </div>
            <table className='table mt-4'>
              <thead>
                <tr>
                  <th width='120'>分類</th>
                  <th>產品名稱</th>
                  <th width='120'>原價</th>
                  <th width='120'>售價</th>
                  <th width='100'>是否啟用</th>
                  <th width='120'>編輯</th>
                </tr>
              </thead>
              <tbody>
                {products && products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.category}</td>
                      <td>{product.title}</td>
                      <td>{product.origin_price}</td>
                      <td>{product.price}</td>
                      <td>
                        {product.is_enabled ? (
                          <span className='text-success'>啟用</span>
                        ) : (
                          <span>未啟用</span>
                        )}
                      </td>
                      <td>
                        <div className='btn-group'>
                          <button
                            type='button'
                            className='btn btn-outline-primary btn-sm'
                            onClick={() => openModal(product, 'edit')}
                          >
                            編輯
                          </button>
                          <button
                            type='button'
                            className='btn btn-outline-danger btn-sm'
                            onClick={() => openModal(product, 'delete')}
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan='5'>尚無產品資料</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className='container login'>
          <div className='row justify-content-center'>
            <h1 className='h3 mb-3 font-weight-normal'>請先登入</h1>
            <div className='col-8'>
              <form id='form' className='form-signin' onSubmit={handleSubmit}>
                <div className='form-floating mb-3'>
                  <input
                    type='email'
                    className='form-control'
                    id='username'
                    placeholder='name@example.com'
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    autoFocus
                    autoComplete='current-username'
                  />
                  <label htmlFor='username'>Email address</label>
                </div>
                <div className='form-floating'>
                  <input
                    type='password'
                    className='form-control'
                    id='password'
                    placeholder='Password'
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    autoComplete='current-password'
                  />
                  <label htmlFor='password'>Password</label>
                </div>
                <button
                  className='btn btn-lg btn-primary w-100 mt-3'
                  type='submit'
                >
                  登入
                </button>
              </form>
            </div>
          </div>
          <p className='mt-5 mb-3 text-muted'>&copy; 2024~∞ - 六角學院</p>
        </div>
      )}
      <div
        id='productModal'
        className='modal fade'
        tabIndex='-1'
        aria-labelledby='productModalLabel'
        aria-hidden='true'
        ref={productModalRef}
      >
        <div className='modal-dialog modal-xl'>
          <div className='modal-content border-0'>
            <div
              className={`modal-header ${
                modalType === 'delete' ? 'bg-danger' : 'bg-dark'
              } text-white`}
            >
              <h5 id='productModalLabel' className='modal-title'>
                <span>
                  {modalType === 'delete'
                    ? '刪除產品'
                    : modalType === 'edit'
                    ? '編輯產品'
                    : '新增產品'}
                </span>
              </h5>
              <button
                type='button'
                className='btn-close'
                data-bs-dismiss='modal'
                aria-label='Close'
              ></button>
            </div>
            <div className='modal-body'>
              {modalType === 'delete' ? (
                <p className='h4'>
                  確定要刪除
                  <span className='text-danger'>{templateData.title}</span>
                  嗎?
                </p>
              ) : (
                <div className='row'>
                  <div className='col-sm-4'>
                    <div className='mb-2'>
                      <div className='mb-3'>
                        <label htmlFor='imageUrl' className='form-label'>
                          輸入圖片網址
                        </label>
                        <input
                          type='text'
                          className='form-control'
                          id='imageUrl'
                          placeholder='請輸入圖片連結'
                          value={templateData.imageUrl}
                          onChange={handleModalInputChange}
                        />
                      </div>
                      {templateData.imageUrl ? (
                        <img
                          className='img-fluid'
                          src={templateData.imageUrl}
                          alt='主圖'
                        />
                      ) : (
                        <></>
                      )}
                    </div>
                    <div>
                      {templateData.imagesUrl.map((image, index) => (
                        <div key={index} className='mb-2'>
                          <input
                            type='text'
                            value={image}
                            onChange={(e) =>
                              handleImageChange(index, e.target.value)
                            }
                            placeholder={`圖片網址 ${index + 1}`}
                            className='form-control mb-2'
                          />
                          {image && (
                            <img
                              src={image}
                              alt={`副圖 ${index + 1}`}
                              className='img-preview mb-2'
                            />
                          )}
                        </div>
                      ))}

                      <div className='d-flex justify-content-between'>
                        {templateData.imagesUrl.length < 5 &&
                          templateData.imagesUrl[
                            templateData.imagesUrl.length - 1
                          ] !== '' && (
                            <button
                              className='btn btn-outline-primary btn-sm w-100'
                              onClick={handleAddImage}
                            >
                              新增圖片
                            </button>
                          )}

                        {templateData.imagesUrl.length >= 1 && (
                          <button
                            className='btn btn-outline-danger btn-sm w-100'
                            onClick={handleRemoveImage}
                          >
                            取消圖片
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className='col-sm-8'>
                    <div className='mb-3'>
                      <label htmlFor='title' className='form-label'>
                        標題
                      </label>
                      <input
                        id='title'
                        type='text'
                        className='form-control'
                        placeholder='請輸入標題'
                        value={templateData.title}
                        onChange={handleModalInputChange}
                      />
                    </div>

                    <div className='row'>
                      <div className='mb-3 col-md-6'>
                        <label htmlFor='category' className='form-label'>
                          分類
                        </label>
                        <input
                          id='category'
                          type='text'
                          className='form-control'
                          placeholder='請輸入分類'
                          value={templateData.category}
                          onChange={handleModalInputChange}
                        />
                      </div>
                      <div className='mb-3 col-md-6'>
                        <label htmlFor='unit' className='form-label'>
                          單位
                        </label>
                        <input
                          id='unit'
                          type='text'
                          className='form-control'
                          placeholder='請輸入單位'
                          value={templateData.unit}
                          onChange={handleModalInputChange}
                        />
                      </div>
                    </div>
                    <div className='row'>
                      <div className='mb-3 col-md-6'>
                        <label htmlFor='origin_price' className='form-label'>
                          原價
                        </label>
                        <input
                          id='origin_price'
                          type='number'
                          min='0'
                          className='form-control'
                          placeholder='請輸入原價'
                          value={templateData.origin_price}
                          onChange={handleModalInputChange}
                        />
                      </div>
                      <div className='mb-3 col-md-6'>
                        <label htmlFor='price' className='form-label'>
                          售價
                        </label>
                        <input
                          id='price'
                          type='number'
                          min='0'
                          className='form-control'
                          placeholder='請輸入售價'
                          value={templateData.price}
                          onChange={handleModalInputChange}
                        />
                      </div>
                    </div>
                    <hr />
                    <div className='mb-3'>
                      <label htmlFor='description' className='form-label'>
                        產品描述
                      </label>
                      <textarea
                        id='description'
                        className='form-control'
                        placeholder='請輸入產品描述'
                        value={templateData.description}
                        onChange={handleModalInputChange}
                      ></textarea>
                    </div>
                    <div className='mb-3'>
                      <label htmlFor='content' className='form-label'>
                        說明內容
                      </label>
                      <textarea
                        id='content'
                        className='form-control'
                        placeholder='請輸入說明內容'
                        value={templateData.content}
                        onChange={handleModalInputChange}
                      ></textarea>
                    </div>
                    <div className='mb-3'>
                      <div className='form-check'>
                        <input
                          id='is_enabled'
                          className='form-check-input'
                          type='checkbox'
                          checked={templateData.is_enabled}
                          onChange={handleModalInputChange}
                        />
                        <label
                          className='form-check-label'
                          htmlFor='is_enabled'
                        >
                          是否啟用
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className='modal-footer'>
              <button
                type='button'
                className='btn btn-outline-secondary'
                data-bs-dismiss='modal'
              >
                取消
              </button>
              {modalType === 'delete' ? (
                <div>
                  <button
                    type='button'
                    className='btn btn-danger'
                    onClick={() => delProductData(templateData.id)}
                  >
                    刪除
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    type='button'
                    className='btn btn-primary'
                    onClick={() => updateProductData(templateData.id)}
                  >
                    確認
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
