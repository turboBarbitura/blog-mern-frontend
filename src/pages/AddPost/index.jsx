import React from 'react';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import SimpleMDE from 'react-simplemde-editor';

import 'easymde/dist/easymde.min.css';
import styles from './AddPost.module.scss';
import {useSelector} from "react-redux";
import {selectIsAuth} from "../../redux/slices/auth";
import {Navigate, useNavigate, useParams} from "react-router-dom";
import axios from "../../axios";

export const AddPost = () => {

  const {id} =useParams()

  const navigate = useNavigate()
  const isAuth = useSelector(selectIsAuth)

  const [isLoading, setIsLoading] = React.useState(false);
  const [text, setText] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const inputFileRef = React.useRef(null)
  //Переменная для того, чтоб понять новая статья создана или отредактированна существующая
  const isEditing = Boolean(id)

  //Алгоритм загрузки картинки
  const handleChangeFile = async (e) => {
    try {
      const formData = new FormData()
      //Вытащили картинку из инпута и положили в переменную
      const file = e.target.files[0]
      formData.append('image', file)
      //Делаем запрос на выгрузку файла на бекенд и помещаем ссылку на файл в переменную
      const { data } = await axios.post('/upload', formData)
      setImageUrl(data.url)
    } catch (err){
      console.warn(err)
      alert('Ошибка при загрузке файла')
    }
  };

  //Удаление картинки
  const onClickRemoveImage = () => {
    setImageUrl('')
  };

  const onChange = React.useCallback((value) => {
    setText(value);
  }, []);

  const onSubmit = async () =>{
    try {
      setIsLoading(true)
      const fields = {
        title,
        imageUrl,
        tags, //tags.split(','),
        text
      }

      const {data} = isEditing ? await axios.patch(`/posts/${id}`, fields) : await axios.post('/posts', fields)

      const _id = isEditing ? id : data._id

      navigate(`/posts/${_id}`)
    } catch (err) {
      console.warn(err)
      alert('Ошибка при создании статьи')
    }
  }

  React.useEffect(()=>{
    if(id){
      axios.get(`/posts/${id}`).then(({data}) => {
        setTitle(data.title)
        setText(data.text)
        setImageUrl(data.imageUrl)
        setTags(data.tags.join(','))
      }).catch(err=>{
        console.warn(err)
        alert('Ошибка при получении статьи')
      })
    }
  }, [])

  const options = React.useMemo(
    () => ({
      spellChecker: false,
      maxHeight: '400px',
      autofocus: true,
      placeholder: 'Введите текст...',
      status: false,
      autosave: {
        enabled: true,
        delay: 1000,
      },
    }),
    [],
  );

  //Если нет токена и я не авторизован, то в этом случае выкидывай на главную.
  if (!window.localStorage.getItem('token') && !isAuth) {
    return <Navigate to='/'/>
  }

  return (
    <Paper style={{padding: 30}}>
      <Button onClick={()=>inputFileRef.current.click()} variant="outlined" size="large">
        Загрузить превью
      </Button>
      <input type="file" ref={inputFileRef} onChange={handleChangeFile} hidden/>
      {imageUrl && (
        <>
          <Button variant="contained" color="error" onClick={onClickRemoveImage}>
            Удалить
          </Button>
          <img className={styles.image} src={`${process.env.REACT_APP_API_URL}/${imageUrl}`} alt="Uploaded"/>
        </>
      )}
      <br/>
      <br/>
      <TextField
        classes={{root: styles.title}}
        variant="standard"
        placeholder="Заголовок статьи..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        fullWidth
      />
      <TextField
        value={tags}
        onChange={e => setTags(e.target.value)}
        classes={{root: styles.tags}}
        variant="standard"
        placeholder="Тэги (перечислите тэги через запятую)"
        fullWidth/>
      <SimpleMDE className={styles.editor} value={text} onChange={onChange} options={options}/>
      <div className={styles.buttons}>
        <Button onClick={onSubmit} size="large" variant="contained">
          {isEditing ? 'Сохранить' : 'Опубликовать'}
        </Button>
        <a href="/">
          <Button size="large">Отмена</Button>
        </a>
      </div>
    </Paper>
  );
};
