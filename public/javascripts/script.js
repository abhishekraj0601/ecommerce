
var nav = document.getElementById("navbar")
var menu = document.getElementById("menu")
var menu_icon = menu.querySelector(".fa-bars")
var menu_content = document.getElementById("menu-content")

let doctitle = document.title;
window.addEventListener("blur",function(){
  document.title ="come back :(";
})
window.addEventListener("focus",function(){
  document.title = doctitle;
})


window.onscroll = () => {
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
      nav.style.background="royalblue";
      // nav.style.boxShadow=" 0px 2px 1px 0px #f2f2ff";
      nav.style.position="fixed";
    } else {
      nav.style.background="transparent";
      nav.style.position="absolute";
      nav.style.boxShadow="none";
    }
  };

  var list = document.querySelectorAll(".list")
  list.forEach(function(elem){
    if(checkSize()){
      elem.addEventListener("click",()=>{
        menu_icon.classList.replace("fa-x","fa-bars")
        menu_content.style.height="0px"
        menu_content.style.boxShadow="none";
      })
    }
  })
  
  function checkSize(){
    var x = window.matchMedia("(max-width:800px)")
    if(x.matches){
        return true;
    }else{
        return false;
    }
  }
  
  
  menu.addEventListener("click",function(){
    if(menu_icon.classList.contains("fa-bars")){
      menu_icon.classList.replace("fa-bars" ,"fa-x")
      menu_content.style.height="300px"  
      menu_content.style.background="royalblue"  
      // menu_content.style.boxShadow=" 0px 2px 10px 2px rgb(221, 221, 221)";
    }else{
      menu_icon.classList.replace("fa-x","fa-bars")
      menu_content.style.height="0px"
      // menu_content.style.boxShadow="none";
  
    }
  })

  var login = document.getElementById("login")
var signup = document.getElementById("signup")

var log_in = document.getElementById("log-in")
var register = document.getElementById("register")

log_in.addEventListener("click",function(){
    signup.style.display="flex"
    login.style.display="none"
})
register.addEventListener("click",function(){
    signup.style.display="none"
    login.style.display="flex"
})

// -------------------------------




function filterFunction() {
  var input, filter, ul, li, a, i;
  input = document.getElementById("myInput");
  filter = input.value.toUpperCase();
  div = document.getElementById("myDropdown");
  a = div.getElementsByTagName("a");
 
  for (i = 0; i < a.length; i++) {
    txtValue = a[i].textContent || a[i].innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      a[i].style.display = "";
    } else {
      a[i].style.display = "none";
    }
  }
}

// ------------------------------------razor pay



